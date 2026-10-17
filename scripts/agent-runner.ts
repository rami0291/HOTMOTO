// Answers the site's model tasks with Claude Code, for a site whose processing mode is agent (docs/agent.md).
//   node --env-file=agent.env scripts/agent-runner.ts
// agent.env: HOTMOTO_URL (the site's address), AGENT_TOKEN (the site's token), and optionally
// AGENT_CONCURRENCY (Claude Code processes at once, 1–8, default 2).
//
// A task carries an article, which is untrusted text, so the model that reads it holds no tools at all.
// This script takes the tasks and posts the answers; each task runs in its own `claude -p` process (a
// fixed executable and argument list, no shell) with the built-in tools, MCP servers and this machine's
// customizations off, the task's instructions as the system prompt and its input on stdin. The process
// sees that one task only, gets only what Claude Code needs to sign in from the environment (never the
// site's token), and its output is only ever the body of that task's answer: it chooses no address, file
// or argument. The file imports nothing from the repository, so it can be copied alone to the machine
// that runs it.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export interface AgentTask {
  id: number;
  purpose: string;
  format: "json" | "text";
  system: string;
  input: string;
  schema: unknown;
  retryNote: string | null;
}

/** The Claude Code executable. Only the tests start something else in its place. */
export interface Cli {
  file: string;
  prefix: string[];
}
const CLAUDE: Cli = { file: "claude", prefix: [] };

/** One run's limits, as docs/agent.md describes them. */
const TASKS_PER_TAKE = 10;
const RUN_MS = 50 * 60_000;
const IDLE_MS = 60_000;
const EMPTY_TAKES = 3;
const FAILURES_IN_A_ROW = 3;
const TASK_TIMEOUT_MS = 10 * 60_000;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

/** Environment names Claude Code needs to start, find its sign-in and reach the network. */
const KEEP = new Set([
  "PATH", "HOME", "USER", "LOGNAME", "LANG", "LANGUAGE", "TZ", "TMPDIR", "TMP", "TEMP",
  "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_STATE_HOME", "XDG_RUNTIME_DIR",
  "SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "USERPROFILE", "USERNAME", "USERDOMAIN", "APPDATA", "LOCALAPPDATA",
  "PROGRAMDATA", "PROGRAMFILES", "HOMEDRIVE", "HOMEPATH", "PATHEXT",
  "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "ALL_PROXY", "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE", "SSL_CERT_DIR",
]);
const KEEP_PREFIXES = ["ANTHROPIC_", "CLAUDE_", "LC_"];
/** Bedrock and Vertex sign in with the cloud's own credentials, passed on only when Claude Code is told to use them. */
const CLOUD_PREFIXES: Record<string, string[]> = {
  CLAUDE_CODE_USE_BEDROCK: ["AWS_"],
  CLAUDE_CODE_USE_VERTEX: ["GOOGLE_", "CLOUD_ML_REGION", "VERTEX_REGION_"],
};

/** The Claude Code process's environment: what it needs to sign in, never AGENT_TOKEN or the site's other keys. */
export function childEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const upper = (name: string) => name.toUpperCase();
  const enabled = (name: string) => Object.entries(env).some(([k, v]) => upper(k) === name && !!v && v !== "0" && v.toLowerCase() !== "false");
  const prefixes = [...KEEP_PREFIXES, ...Object.entries(CLOUD_PREFIXES).flatMap(([flag, more]) => (enabled(flag) ? more : []))];
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(env)) {
    const key = upper(name);
    if (value !== undefined && (KEEP.has(key) || prefixes.some((p) => key.startsWith(p)))) out[name] = value;
  }
  return out;
}

/**
 * The fixed arguments: no built-in tool, nothing from this machine's configuration, the result as JSON.
 * The step's schema goes in the system prompt, not --json-schema: Claude Code refuses the draft 2020-12
 * schemas the site sends, and the site checks every answer against the step's schema anyway.
 */
export function claudeArgs(systemFile: string): string[] {
  return [
    "-p",
    "--tools", "",
    "--safe-mode",
    "--strict-mcp-config",
    "--no-session-persistence",
    "--output-format", "json",
    "--system-prompt-file", systemFile,
  ];
}

/** The task's own instructions, and how to hand back its answer. */
export function systemPrompt(task: AgentTask): string {
  const answer = task.format === "text" ? "答えの本文だけを出力し、前置きや説明を付けない。"
    : task.schema && typeof task.schema === "object" ? `答えは次の JSON Schema に合う JSON オブジェクト 1 つだけにする。\n${JSON.stringify(task.schema)}`
    : "答えは JSON オブジェクト 1 つだけにする。";
  return `${task.system}\n\n${answer}`;
}

/** The task's input, with the reason the previous answer could not be used. */
export function promptInput(task: AgentTask): string {
  return task.retryNote ? `${task.input}\n\n【前回の答えが使えなかった理由】\n${task.retryNote}` : task.input;
}

function run(cli: Cli, args: string[], stdin: string, cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cli.file, [...cli.prefix, ...args], {
      cwd, env: childEnv(process.env), shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"], timeout: timeoutMs,
    });
    const out: Buffer[] = [];
    let size = 0;
    let err = "";
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_OUTPUT_BYTES) child.kill();
      else out.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => { err = (err + chunk.toString("utf8")).slice(-2000); });
    // A process that exits before reading its input closes the pipe; its exit status tells why.
    child.stdin.on("error", () => {});
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0 && size <= MAX_OUTPUT_BYTES) return resolve(Buffer.concat(out).toString("utf8"));
      const why = size > MAX_OUTPUT_BYTES ? "output too large" : signal ? `stopped by ${signal}` : `exited with ${code}`;
      reject(new Error(`claude ${why}${err.trim() ? `: ${err.trim().slice(-300)}` : ""}`));
    });
    child.stdin.end(stdin);
  });
}

/** The answer's text in Claude Code's result; the site reads a json task's object out of it. */
export function answerOf(stdout: string): string {
  let result: { is_error?: boolean; subtype?: string; result?: unknown };
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error("claude did not print its JSON result");
  }
  if (result.is_error || result.subtype !== "success") throw new Error(`claude did not answer (${result.subtype ?? "error"})`);
  if (typeof result.result !== "string" || !result.result.trim()) throw new Error("claude answered nothing");
  return result.result;
}

/** Answers one task in a fresh Claude Code process, in a fresh empty directory that is removed after. */
export async function askClaude(task: AgentTask, cli: Cli = CLAUDE, timeoutMs = TASK_TIMEOUT_MS): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "hotmoto-agent-"));
  try {
    const systemFile = path.join(dir, "system.md");
    await writeFile(systemFile, systemPrompt(task), { mode: 0o600 });
    return answerOf(await run(cli, claudeArgs(systemFile), promptInput(task), dir, timeoutMs));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** The site refused the token or could not be reached: nothing more in this run can succeed. */
class Fatal extends Error {}

function validTask(value: unknown): value is AgentTask {
  const t = value as Partial<AgentTask> | null;
  return !!t && Number.isSafeInteger(t.id) && t.id! > 0 && typeof t.purpose === "string" && (t.format === "json" || t.format === "text") &&
    typeof t.system === "string" && typeof t.input === "string" && (t.retryNote === null || t.retryNote === undefined || typeof t.retryNote === "string");
}

async function call(base: URL, token: string, pathname: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(new URL(pathname, base), {
      ...init, redirect: "error", signal: AbortSignal.timeout(30_000),
      headers: { ...init.headers as Record<string, string>, authorization: `Bearer ${token}` },
    });
  } catch (error) {
    throw new Fatal(`the site could not be reached: ${(error as Error).message}`);
  }
}

async function takeTasks(base: URL, token: string): Promise<AgentTask[]> {
  const res = await call(base, token, `/api/agent/tasks?limit=${TASKS_PER_TAKE}`);
  if (res.status === 401) throw new Fatal("the site refused AGENT_TOKEN");
  if (!res.ok) throw new Fatal(`taking tasks failed (HTTP ${res.status})`);
  const body = await res.json() as { tasks?: unknown };
  return Array.isArray(body.tasks) ? body.tasks.filter(validTask).map((t) => ({ ...t, retryNote: t.retryNote ?? null })) : [];
}

/** Posts one answer; false when the site no longer waits for it (answered elsewhere or withdrawn). */
async function postAnswer(base: URL, token: string, id: number, output: unknown): Promise<boolean> {
  const res = await call(base, token, `/api/agent/tasks/${id}/answer`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ output }),
  });
  await res.body?.cancel();
  if (res.status === 401) throw new Fatal("the site refused AGENT_TOKEN");
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`the site refused the answer (HTTP ${res.status})`);
  return true;
}

export interface RunOptions {
  base: URL;
  token: string;
  concurrency: number;
  ask: (task: AgentTask) => Promise<unknown>;
  runMs?: number;
  idleMs?: number;
  log?: (line: string) => void;
}

/**
 * One run: take tasks and answer them until the site has none three takes in a row, the run's time is
 * up, or three tasks in a row fail (signed out, out of usage). Tasks taken but not answered go back to
 * the site's queue when their claim lapses.
 */
export async function runAgent(o: RunOptions): Promise<{ answered: number; failed: number }> {
  const deadline = Date.now() + (o.runMs ?? RUN_MS);
  const log = o.log ?? console.log;
  let answered = 0;
  let failed = 0;
  let inARow = 0;
  let empty = 0;
  let fatal: Error | null = null;
  const stopping = () => !!fatal || inARow >= FAILURES_IN_A_ROW || Date.now() >= deadline;
  while (!stopping()) {
    const tasks = await takeTasks(o.base, o.token);
    if (tasks.length === 0) {
      if (++empty >= EMPTY_TAKES) break;
      await new Promise((resolve) => setTimeout(resolve, o.idleMs ?? IDLE_MS));
      continue;
    }
    empty = 0;
    const queue = [...tasks];
    const worker = async () => {
      for (let task = queue.shift(); task && !stopping(); task = queue.shift()) {
        const started = Date.now();
        try {
          const kept = await postAnswer(o.base, o.token, task.id, await o.ask(task));
          if (kept) answered++;
          inARow = 0;
          log(`${kept ? "✓" : "–"} #${task.id} ${task.purpose} ${((Date.now() - started) / 1000).toFixed(1)}s${kept ? "" : " (no longer waiting)"}`);
        } catch (error) {
          if (error instanceof Fatal) { fatal = error; return; }
          failed++;
          inARow++;
          log(`✗ #${task.id} ${task.purpose}: ${(error as Error).message}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(o.concurrency, tasks.length) }, worker));
  }
  if (fatal) throw fatal;
  if (inARow >= FAILURES_IN_A_ROW) log(`${FAILURES_IN_A_ROW} tasks in a row failed: stopping this run`);
  return { answered, failed };
}

if (import.meta.main) {
  const url = process.env.HOTMOTO_URL ?? "";
  const token = process.env.AGENT_TOKEN ?? "";
  const concurrency = Math.min(8, Math.max(1, Math.floor(Number(process.env.AGENT_CONCURRENCY) || 2)));
  if (!/^https?:\/\//i.test(url) || !token) {
    console.error("Set HOTMOTO_URL (the site's address) and AGENT_TOKEN, e.g. node --env-file=agent.env scripts/agent-runner.ts");
    process.exit(1);
  }
  try {
    const { answered, failed } = await runAgent({ base: new URL(url), token, concurrency, ask: (task) => askClaude(task) });
    console.log(`answered ${answered}, failed ${failed}`);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
