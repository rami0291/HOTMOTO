// The structure step's fields from the site's modules (StructureField; editorial/analyze.ts structureRequest).
// Written from the ways it can go wrong:
// - with no module installed the request changes, so stored receipts stop matching and the step is not the one
//   its prompt says;
// - a field's hint and grounding read more than the article's own texts (the source's name, the link, a
//   translation), or less than the model saw (the quoted post), so it backs what the article does not say;
// - a missing or broken answer for the field fails the whole step, or a field replaces one of the step's own;
// - the field's version is not in the step's prompt version.
import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { buildMaterial, groundFields, PROMPT_VERSIONS, STRUCTURE_SYSTEM, StructureSchema, structureRequest } from "@hotmoto/backend/editorial/analyze";
import type { AnalyzeInputArticle } from "@hotmoto/backend/editorial/input";
import { MAX_BODY_CHARS } from "@hotmoto/backend/editorial/writing";
import { installModules, type StructureField } from "@hotmoto/backend/modules";

const article = (over: Partial<AnalyzeInputArticle> = {}): AnalyzeInputArticle => ({
  id: "structure-fields", revision: 1, title: "Acme Trail 650 launched", url: "https://example.org/acme-news", author: null, publishedAt: null,
  bodyText: "Acme launched the Trail 650.", excerpt: null, xPost: null, media: [], translationZh: "Acme 发布了 Roadster 900。",
  source: { name: "Roadster 900 Weekly", kind: "rss", tier: "T2", firstParty: false }, ...over,
});

const base = { scope: "single", category: "new-models", tags: ["新型車"], subjects: [], fact: null };

/** Repeats what the hint saw, and keeps the answer's words those texts contain. */
const echo: StructureField<{ said: string[] }> = {
  key: "echo",
  version: "echo@1",
  instructions: "ECHO: list under echo.said the product names the article is about.",
  hint: (texts) => `<echo>${texts.join(" | ")}</echo>`,
  schema: z.object({ said: z.array(z.string()).catch([]) }).catch({ said: [] }),
  ground: (answer, texts) => answer.said.filter((word) => texts.some((t) => t.includes(word))),
};

test("with no module installed, the request is the step's own", () => {
  installModules([]);
  const a = article();
  const req = structureRequest(a);
  assert.equal(req.system, STRUCTURE_SYSTEM);
  assert.equal(req.user, buildMaterial(a));
  assert.equal(req.schema, StructureSchema);
  assert.equal(req.promptVersion, PROMPT_VERSIONS.structure);
  assert.deepEqual(groundFields(req, StructureSchema.parse(base)), {});
});

test("a field adds its instructions, its hint on the article's own texts and its version", () => {
  installModules([{ name: "echo", structure: [echo] }]);
  const a = article();
  const req = structureRequest(a);
  assert.equal(req.system, `${STRUCTURE_SYSTEM}\n\n${echo.instructions}`);
  assert.equal(req.user, `${buildMaterial(a)}\n\n<echo>Acme Trail 650 launched | Acme launched the Trail 650.</echo>`);
  assert.equal(req.promptVersion, `${PROMPT_VERSIONS.structure}+echo@1`);
  const answer = req.schema.parse({ ...base, echo: { said: ["Trail 650", "Roadster 900", "acme-news"] } });
  assert.deepEqual(groundFields(req, answer), { echo: ["Trail 650"] });
  // The step's own fields read as they do alone; the field's broken answer is its empty one.
  const broken = req.schema.parse({ ...base, echo: "Trail 650" });
  assert.deepEqual({ ...broken, echo: undefined }, { ...StructureSchema.parse(base), echo: undefined });
  assert.deepEqual(groundFields(req, broken), { echo: [] });
});

test("the texts are the post and its quote, cut where the model's material is", () => {
  installModules([{ name: "echo", structure: [echo] }]);
  const post = article({ title: "post", bodyText: null, xPost: { text: "Trail 650 first ride", quoted: { text: "Acme launches the Trail 650", handle: "acme" } } });
  assert.deepEqual(structureRequest(post).texts, ["Trail 650 first ride", "Acme launches the Trail 650"]);
  const long = structureRequest(article({ bodyText: "x".repeat(MAX_BODY_CHARS + 50) }));
  assert.equal(long.texts[1]!.length, MAX_BODY_CHARS);
});

test("a field cannot replace one of the step's own", () => {
  installModules([{ name: "fact", structure: [{ ...echo, key: "fact" }] }]);
  assert.throws(() => structureRequest(article()), /would replace the step's own/);
  installModules([]);
});
