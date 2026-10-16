// The structure step's vehicles field (backend/field.ts), alone and in the engine's request. Written from the
// ways it can go wrong:
// - the model's answer keeps a slug the texts do not name (an invented one, or a sibling of the one they name),
//   or a series they do not speak of;
// - an unlisted name the texts do not contain, or one the dictionary already has, waits for review;
// - a missing or broken answer fails the structure step;
// - the hint reads the source's name or the link instead of the article's own texts, or the installed module's
//   field is missing from the structure request, its answer or its prompt version.
import assert from "node:assert/strict";
import { test } from "node:test";
import { groundFields, structureRequest } from "@hotmoto/backend/editorial/analyze";
import { promptText } from "@hotmoto/backend/editorial/prompts";
import type { AnalyzeInputArticle } from "@hotmoto/backend/editorial/input";
import { installModules } from "@hotmoto/backend/modules";
import { groundVehicles, VehiclesAnswer, vehiclesHint } from "../backend/field.ts";
import vehicles from "../server.ts";

test("the answer keeps only the models and series the texts name, and the new names they contain", () => {
  const texts = ["【リコール】レブル250 と CBR250RR", "レブルシリーズのうち、海外仕様のレブル300も対象。"];
  const answer = {
    models: ["honda-rebel-250", "honda-rebel-1100", "honda-rebel-9999", "honda-rebel-250"],
    families: ["honda-rebel", "husqvarna-svartpilen"],
    unlisted: ["CBR250RR", "レブル250", "Ninja 1000SX", "  ", "cbr250rr"],
  };
  assert.deepEqual(groundVehicles(answer, texts), {
    found: ["honda-rebel-250", "honda-cbr250rr"],
    models: ["honda-rebel-250"],
    families: ["honda-rebel"],
    unlisted: ["レブル300"],
  });
});

test("a missing or broken answer is an empty one", () => {
  const none = { models: [], families: [], unlisted: [] };
  assert.deepEqual(VehiclesAnswer.parse(undefined), none);
  assert.deepEqual(VehiclesAnswer.parse("honda-rebel-250"), none);
  assert.deepEqual(VehiclesAnswer.parse({ models: "honda-rebel-250", unlisted: ["Rebel 300"] }), { ...none, unlisted: ["Rebel 300"] });
});

test("the hint says what the dictionary found, or that it found nothing", () => {
  const hint = vehiclesHint(["8BK-MC49 のリコール", "レブルシリーズとレブル300"]);
  assert.match(hint, /honda-rebel-250：レブル250、249cc、「8BK-MC49」/);
  assert.match(hint, /honda-rebel：レブル、「レブル」/);
  assert.match(hint, /辞書にない車種名：「レブル300」/);
  assert.match(vehiclesHint(["ヘルメットの新製品"]), /見つかった車種：なし/);
});

test("installed, the field is in the structure request and its answer", () => {
  installModules([vehicles]);
  const a: AnalyzeInputArticle = {
    id: "vehicles-field", revision: 1, title: "レブル250 の新色", url: "https://example.org/rebel-1100", author: null, publishedAt: null,
    bodyText: "ホンダはレブル250にカラーを追加した。", excerpt: null, xPost: null, media: [],
    source: { name: "Rebel 1100 Owners", kind: "rss", tier: "T2", firstParty: false },
  };
  const req = structureRequest(a);
  assert.ok(req.system.endsWith(promptText("structure-vehicles")));
  assert.match(req.user, /<vehicles>\n見つかった車種（[^\n]*\n- honda-rebel-250：[^\n]*\n<\/vehicles>$/);
  assert.match(req.promptVersion, /\+structure-vehicles@/);
  const answer = req.schema.parse({
    scope: "single", category: "new-models", tags: ["モデルチェンジ"], subjects: ["honda"], fact: null,
    vehicles: { models: ["honda-rebel-250", "honda-rebel-1100"], families: [], unlisted: [] },
  });
  assert.deepEqual(groundFields(req, answer), { vehicles: { found: ["honda-rebel-250"], models: ["honda-rebel-250"], families: [], unlisted: [] } });
});
