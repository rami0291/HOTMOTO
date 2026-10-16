// The vehicle dictionary (industry/vehicles.ts): which spellings are the same name, which class a model is in,
// and which models a name may point to. Written from the ways it can go wrong:
// - the same name in full-width, another case or other spacing counts as a different name, so the dictionary
//   lists each spelling by hand and still misses the next one; or the katakana prolonged sound mark is dropped
//   as if it were a hyphen;
// - a model's class follows the license instead of the vehicle law, so a 250cc bike is put with the 400s that
//   need 車検; or a boundary (50 / 125 / 250 / 400cc) falls on the wrong side;
// - one name points to two models (a sibling's name filed under the other), so an article about one reaches
//   the followers of both; or a series name or a type code is also a model's name;
// - a type code is shared across makers, a series holds a single model or another maker's, or a model names a
//   maker the structure step does not know.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ENTITIES } from "@hotmoto/industry/taxonomy";
import { aliasKey, licenseClassOf, VEHICLE_FAMILIES, vehicleClassOf, VEHICLES, type LicenseClass, type VehicleClass } from "@hotmoto/industry/vehicles";

const models = Object.entries(VEHICLES);

test("spellings that differ only in width, case or separators share one key", () => {
  for (const s of ["ＲＥＢＥＬ　２５０", "rebel250", "REBEL-250", "Rebel‐250"]) assert.equal(aliasKey(s), aliasKey("Rebel 250"), s);
  assert.equal(aliasKey("ｽｰﾊﾟｰｶﾌﾞ50"), aliasKey("スーパーカブ50"));
  assert.equal(aliasKey("CT125・ハンターカブ"), aliasKey("CT125 ハンターカブ"));
  assert.equal(aliasKey("H’ness CB350"), aliasKey("H'ness CB350"));
  assert.equal(aliasKey("スーパーカブ"), "スーパーカブ");
  assert.notEqual(aliasKey("Rebel 250"), aliasKey("Rebel 2500"));
});

test("classes follow the vehicle law and the license law, each at its own boundaries", () => {
  const cases: [number, VehicleClass, LicenseClass][] = [
    [50, "gentsuki-1", "gentsuki"],
    [51, "gentsuki-2", "kogata-gentei"],
    [125, "gentsuki-2", "kogata-gentei"],
    [125.1, "kei-nirin", "futsu-nirin"],
    [126, "kei-nirin", "futsu-nirin"],
    [250, "kei-nirin", "futsu-nirin"],
    [250.1, "kogata-nirin", "futsu-nirin"],
    [251, "kogata-nirin", "futsu-nirin"],
    [400, "kogata-nirin", "futsu-nirin"],
    [400.1, "kogata-nirin", "oogata-nirin"],
    [401, "kogata-nirin", "oogata-nirin"],
  ];
  for (const [cc, vehicle, license] of cases) {
    assert.equal(vehicleClassOf({ displacementCc: cc }), vehicle, `${cc}cc`);
    assert.equal(licenseClassOf({ displacementCc: cc }), license, `${cc}cc`);
  }
  // One license, two vehicle classes: the Rebel 250 has no 車検, the GB350 does.
  const rebel = VEHICLES["honda-rebel-250"], gb = VEHICLES["honda-gb350"];
  assert.equal(licenseClassOf(rebel), licenseClassOf(gb));
  assert.notEqual(vehicleClassOf(rebel), vehicleClassOf(gb));
});

test("every model has a stable slug, a known maker, a displacement and a name", () => {
  for (const [slug, m] of models) {
    assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, slug);
    assert.ok(m.maker in ENTITIES, `${slug}: maker ${m.maker} is not in ENTITIES`);
    assert.ok(Number.isFinite(m.displacementCc) && m.displacementCc > 0, slug);
    assert.ok(m.name.trim().length > 0, `${slug} has no display name`);
    assert.ok(m.aliases.length > 0, `${slug} has no alias`);
  }
});

test("a model writes each name once, and no name is only a number", () => {
  for (const [slug, m] of models) {
    for (const list of [m.aliases, m.typeCodes ?? []]) {
      const keys = list.map(aliasKey);
      assert.deepEqual(list.filter((_, i) => keys.indexOf(keys[i]) !== i), [], `${slug}: written again in another spelling`);
    }
    for (const name of [...m.aliases, ...(m.typeCodes ?? [])]) assert.doesNotMatch(aliasKey(name), /^\d*$/, `${slug}: "${name}"`);
  }
});

test("a name points to one model, and is neither a series name nor a type code", () => {
  const owners = new Map<string, string[]>();
  const add = (key: string, owner: string) => owners.set(key, [...(owners.get(key) ?? []), owner]);
  for (const [slug, m] of models) for (const a of m.aliases) add(aliasKey(a), slug);
  for (const [id, f] of Object.entries(VEHICLE_FAMILIES)) for (const a of f.aliases) add(aliasKey(a), `series ${id}`);
  for (const [slug, m] of models) {
    for (const code of new Set((m.typeCodes ?? []).map(aliasKey))) if (owners.has(code)) add(code, `type code of ${slug}`);
  }
  assert.deepEqual([...owners].filter(([, o]) => o.length > 1), []);
});

test("a type code is shared only by siblings of one maker", () => {
  const makers = new Map<string, Set<string>>();
  for (const m of Object.values(VEHICLES)) {
    for (const code of m.typeCodes ?? []) makers.set(aliasKey(code), (makers.get(aliasKey(code)) ?? new Set()).add(m.maker));
  }
  assert.deepEqual([...makers].filter(([, s]) => s.size > 1).map(([code, s]) => [code, [...s]]), []);
});

test("a series holds two or more models, all of its own maker", () => {
  for (const [slug, m] of models) if (m.family) assert.ok(m.family in VEHICLE_FAMILIES, `${slug}: unknown series ${m.family}`);
  for (const [id, f] of Object.entries(VEHICLE_FAMILIES)) {
    const members = Object.values(VEHICLES).filter((m) => m.family === id);
    assert.ok(members.length >= 2, `${id} holds ${members.length} model(s)`);
    assert.ok(f.maker in ENTITIES, `${id}: maker ${f.maker} is not in ENTITIES`);
    for (const m of members) assert.equal(m.maker, f.maker, `${m.name} in ${id}`);
  }
});

test("model numbers are not used as engine capacities or license classes", () => {
  const cases: [string, number, VehicleClass, LicenseClass][] = [
    ["honda-pcx-125", 124, "gentsuki-2", "kogata-gentei"],
    ["honda-pcx-160", 156, "kei-nirin", "futsu-nirin"],
    ["kawasaki-ninja-500", 451, "kogata-nirin", "oogata-nirin"],
    ["suzuki-v-strom-250", 248, "kei-nirin", "futsu-nirin"],
    ["suzuki-v-strom-250sx", 249, "kei-nirin", "futsu-nirin"],
    ["ktm-390-duke", 398.7, "kogata-nirin", "futsu-nirin"],
    ["husqvarna-svartpilen-401", 398.6, "kogata-nirin", "futsu-nirin"],
    ["bmw-f450gs", 420, "kogata-nirin", "oogata-nirin"],
    ["bmw-f800gs", 895, "kogata-nirin", "oogata-nirin"],
    ["royal-enfield-himalayan-450", 452, "kogata-nirin", "oogata-nirin"],
    ["cfmoto-450sr", 449, "kogata-nirin", "oogata-nirin"],
    ["cfmoto-675sr-r", 674, "kogata-nirin", "oogata-nirin"],
    ["voge-ds525x", 494, "kogata-nirin", "oogata-nirin"],
    ["tvs-apache-rr310", 312.2, "kogata-nirin", "futsu-nirin"],
  ];
  for (const [slug, cc, vehicle, license] of cases) {
    assert.equal(VEHICLES[slug].displacementCc, cc, slug);
    assert.equal(vehicleClassOf(VEHICLES[slug]), vehicle, slug);
    assert.equal(licenseClassOf(VEHICLES[slug]), license, slug);
  }
});
