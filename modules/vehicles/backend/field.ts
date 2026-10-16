// The structure step's `vehicles` field (StructureField in backend/modules.ts): the dictionary match of the
// article's own texts follows the material as a hint, and the model's answer keeps only what that match backs:
// dictionary models and series the texts name, and unlisted model names the texts contain. The unlisted names
// wait for review (scripts/unlisted.ts) so the dictionary can grow.
import { z } from "zod";
import { promptText, promptVersion } from "@hotmoto/backend/editorial/prompts";
import type { StructureField } from "@hotmoto/backend/modules";
import { aliasKey, VEHICLE_FAMILIES, VEHICLES } from "@hotmoto/industry/vehicles";
import { matchVehicles } from "./match.ts";

const NONE = { models: [], families: [], unlisted: [] };

export const VehiclesAnswer = z.object({
  models: z.array(z.string()).catch([]),
  families: z.array(z.string()).catch([]),
  unlisted: z.array(z.string()).catch([]),
}).catch(NONE);

export type VehiclesAnswer = z.infer<typeof VehiclesAnswer>;

/** What an analysis stores: the dictionary's own match, and the model's answer as far as the match backs it. */
export interface VehiclesField {
  /** Every model the dictionary found in the texts. */
  found: string[];
  /** Those the article is about. */
  models: string[];
  /** Series it speaks of as a whole. */
  families: string[];
  /** Model names in the texts that the dictionary does not have: the match's own (a series and a number) and the model's. */
  unlisted: string[];
}

const MAX_UNLISTED = 6;
const MAX_NAME_CHARS = 60;

export function vehiclesHint(texts: readonly string[]): string {
  const found = matchVehicles(texts);
  const lines = ["<vehicles>"];
  lines.push(found.models.size ? "見つかった車種（slug：名前、排気量、原文の表記）：" : "見つかった車種：なし");
  for (const [slug, as] of found.models) lines.push(`- ${slug}：${VEHICLES[slug]!.name}、${VEHICLES[slug]!.displacementCc}cc、「${as}」`);
  if (found.families.size) lines.push("系列名（id：名前、原文の表記）：");
  for (const [id, as] of found.families) lines.push(`- ${id}：${VEHICLE_FAMILIES[id as keyof typeof VEHICLE_FAMILIES].name}、「${as}」`);
  if (found.unlisted.length) lines.push(`辞書にない車種名：${found.unlisted.map((name) => `「${name}」`).join("、")}`);
  lines.push("</vehicles>");
  return lines.join("\n");
}

/** A name the dictionary already resolves to a model or a series. */
export function dictionaryKnows(name: string): boolean {
  const m = matchVehicles([name]);
  return m.models.size > 0 || m.families.size > 0;
}

export function groundVehicles(answer: VehiclesAnswer, texts: readonly string[]): VehiclesField {
  const found = matchVehicles(texts);
  const seen = aliasKey(texts.join("\n"));
  const unlisted = new Map<string, string>();
  for (const name of [...found.unlisted, ...answer.unlisted.map((n) => n.trim())]) {
    const key = aliasKey(name);
    if (!key || name.length > MAX_NAME_CHARS || !seen.includes(key) || dictionaryKnows(name) || unlisted.has(key)) continue;
    unlisted.set(key, name);
  }
  return {
    found: [...found.models.keys()],
    models: [...new Set(answer.models.map((s) => s.trim()))].filter((slug) => found.models.has(slug)),
    families: [...new Set(answer.families.map((s) => s.trim()))].filter((id) => found.families.has(id)),
    unlisted: [...unlisted.values()].slice(0, MAX_UNLISTED),
  };
}

export const vehiclesField: StructureField<VehiclesAnswer> = {
  key: "vehicles",
  version: promptVersion("structure-vehicles"),
  instructions: promptText("structure-vehicles"),
  hint: vehiclesHint,
  schema: VehiclesAnswer,
  ground: groundVehicles,
};
