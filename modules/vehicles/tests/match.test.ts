// The dictionary match (backend/match.ts). Written from the ways it can go wrong, with real headlines first:
// - an article about one displacement also names its siblings (the Rebel 1100 brings in the 250 and the 500);
// - a recall that names only its type code finds no model, or only one of the siblings that share the code;
// - a name in Chinese, full-width or with a unit after it is missed;
// - a name is found inside a longer model name or code (CB250R in CBR250RR, MC49 in MC490);
// - a series name with a number after it counts as the series, though it names a model the dictionary lacks;
//   or the series is reported where a longer model name covers it;
// - one name is reported again for each spelling.
import assert from "node:assert/strict";
import { test } from "node:test";
import { aliasKey, VEHICLES } from "@hotmoto/industry/vehicles";
import { matchVehicles } from "../backend/match.ts";

const match = (...texts: string[]) => {
  const m = matchVehicles(texts);
  return { models: [...m.models.keys()], families: [...m.families.keys()], unlisted: m.unlisted };
};

test("an article about one displacement does not name its siblings", () => {
  assert.deepEqual(match(
    "ホンダが大型クルーザー「レブル1100」の2026年カラーバリエーションを変更、8BL-SC83型を3月発売",
    "本田技研工業は1082cc水冷パラレルツインを搭載する大型クルーザーモデルRebel 1100およびRebel 1100 Tの仕様を一部変更した。",
  ), { models: ["honda-rebel-1100"], families: [], unlisted: [] });
  assert.deepEqual(match(
    "ハスクバーナ・モーターサイクルズ、新型「スヴァルトピレン401」の国内デリバリーを開始",
    "フルモデルチェンジを受けた398cc単気筒ネイキッドSvartpilen 401およびVitpilen 401が正規ディーラーに入荷。",
  ).models, ["husqvarna-svartpilen-401", "husqvarna-vitpilen-401"]);
});

test("a type code names its model, and every sibling that shares it", () => {
  assert.deepEqual(match("【リコール】ホンダ「8BK-MC49」計4,120台、燃料ポンプのインペラ不具合でエンストのおそれ").models, ["honda-rebel-250"]);
  assert.deepEqual(match("対象となる型式は8BK-RG74J。").models, ["yamaha-yzf-r25", "yamaha-mt-25"]);
});

test("names in Chinese, in full width or with a unit after them are found", () => {
  assert.deepEqual(match("张雪机车9月出货量达9,979台，四缸仿赛500RR与三缸820RR成增长核心").models, ["zxmoto-500rr", "zxmoto-820rr"]);
  assert.deepEqual(match("春风动力发布新款450SR-S与三缸675SR-R海外出口数据").models, ["cfmoto-450sr", "cfmoto-675sr-r"]);
  assert.deepEqual(match("ＲＥＢＥＬ　２５０の新色").models, ["honda-rebel-250"]);
  assert.deepEqual(match("レブル250ccの足つき").models, ["honda-rebel-250"]);
});

test("a name inside a longer model name or code is not found", () => {
  assert.deepEqual(match("CBR250RRの新色").models, ["honda-cbr250rr"]);
  assert.deepEqual(match("車台番号 MC490 から").models, []);
  assert.deepEqual(match("CBR250RR と CB250R を比べる").models, ["honda-cbr250rr", "honda-cb250r"]);
  assert.deepEqual(match("GSX-8TT と GSX-8T、S1000RR と S1000R").models, ["suzuki-gsx-8tt", "suzuki-gsx-8t", "bmw-s1000rr", "bmw-s1000r"]);
});

test("a series alone is the series; with a number after it, a model the dictionary lacks", () => {
  assert.deepEqual(match("レブルシリーズ全車にリコール"), { models: [], families: ["honda-rebel"], unlisted: [] });
  assert.deepEqual(match("レブル300 の海外仕様"), { models: [], families: [], unlisted: ["レブル300"] });
  assert.deepEqual(match("Svartpilen 200 が欧州で登場"), { models: [], families: [], unlisted: ["Svartpilen 200"] });
  assert.deepEqual(match("レブル300ccとレブル1100"), { models: ["honda-rebel-1100"], families: [], unlisted: ["レブル300"] });
});

test("every dictionary alias names only its own model, including overlapping series and trims", () => {
  for (const [slug, model] of Object.entries(VEHICLES)) {
    for (const alias of model.aliases) assert.deepEqual(match(alias), { models: [slug], families: [], unlisted: [] }, `${slug}: ${alias}`);
  }
});

test("every type code finds exactly the models sharing that code", () => {
  const owners = new Map<string, string[]>();
  for (const [slug, model] of Object.entries(VEHICLES)) {
    for (const code of model.typeCodes ?? []) owners.set(aliasKey(code), [...(owners.get(aliasKey(code)) ?? []), slug]);
  }
  for (const [code, slugs] of owners) assert.deepEqual(match(code).models, slugs, code);
});

test("different models on one platform have separate names and retain shared recall codes", () => {
  assert.deepEqual(match("CB650R E-Clutch と CBR650R E-Clutch").models, ["honda-cb650r", "honda-cbr650r"]);
  assert.deepEqual(match("8BL-RH17").models, ["honda-cb650r", "honda-cbr650r"]);
  assert.deepEqual(match("GSX-8S").models, ["suzuki-gsx-8s"]);
  assert.deepEqual(match("GB350 C").models, ["honda-gb350c"]);
  assert.deepEqual(match("8BL-NC64").models, ["honda-gb350c"]);
  assert.deepEqual(match("W230 と MEGURO S1").models, ["kawasaki-w230-meguro-s1", "kawasaki-meguro-s1"]);
  assert.deepEqual(match("Speed 400 と Scrambler 400 X").models, ["triumph-speed-400", "triumph-scrambler-400x"]);
});

test("displacement siblings, overseas names and Chinese spellings remain distinct", () => {
  assert.deepEqual(match("PCX125、PCX160、NMAX155").models, ["honda-pcx-125", "honda-pcx-160", "yamaha-nmax-155"]);
  assert.deepEqual(match("V-STROM 250 と V-STROM 250SX").models, ["suzuki-v-strom-250", "suzuki-v-strom-250sx"]);
  assert.deepEqual(match("Ｒ１３００ＧＳ　Ａｄｖｅｎｔｕｒｅ").models, ["bmw-r1300gs-adventure"]);
  assert.deepEqual(match("CFMOTO 675SS and Ibex 450").models, ["cfmoto-675sr-r", "cfmoto-450mt"]);
  assert.deepEqual(match("春風800MT-X、無極900DSX、喜馬拉雅450").models, ["cfmoto-800mt-x", "voge-ds900x", "royal-enfield-himalayan-450"]);
  assert.deepEqual(match("钱江追600").models, ["qjmotor-srk-600"]);
  assert.deepEqual(match("赛600、张雪三缸").models, []);
  assert.deepEqual(match("PCXの全シリーズ、Vストロームシリーズ").families, ["honda-pcx", "suzuki-v-strom"]);
});

test("each model and unlisted name is reported once, with its first spelling", () => {
  const m = matchVehicles(["Rebel 250 と Rebel 300", "レブル250、REBEL300"]);
  assert.deepEqual([...m.models], [["honda-rebel-250", "Rebel 250"]]);
  assert.deepEqual(m.unlisted, ["Rebel 300"]);
});
