// The vehicle dictionary (industry/vehicles.ts) matched against an article's own texts: the models, series and
// unlisted model names they name. Deterministic, so the structure step's model gets it as a hint and its answer
// is held to it (field.ts).
// - A name matches with its spelling evened out as aliasKey does (width, case, separators between its letters).
// - A Latin or digit edge holds only where the text does not go on with a letter or digit (CB250R is not inside
//   CBR250RR, MC49 not inside MC490); a name ending in a digit may be followed by the unit cc (レブル250cc).
// - Where names overlap, the longest wins (Rebel 1100 over the series Rebel); on a tie, a dictionary model.
// - A type code names every model that shares it (siblings on one frame).
// - A series name followed by a number names a model the dictionary lacks (Rebel 300), not the series.
import { aliasKey, NAME_SEPARATORS, VEHICLE_FAMILIES, VEHICLES } from "@hotmoto/industry/vehicles";

export interface VehicleMatch {
  /** slug → its first spelling in the texts. */
  models: Map<string, string>;
  /** series id → its first spelling. */
  families: Map<string, string>;
  /** Model names the dictionary does not have, as written, one per spelling key. */
  unlisted: string[];
}

type Target = { kind: "models"; slugs: string[] } | { kind: "family"; id: string };

const SEP = `[${NAME_SEPARATORS}]*`;
const EDGE = /[a-z0-9]/i;
const escape = (c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The number after a series name, without a trailing cc. */
const NUMBER_AFTER = new RegExp(`^${SEP}\\d+(?:(?!cc(?![a-z0-9]))[a-z0-9])*`, "i");

function pattern(name: string, family = false): RegExp {
  const chars = [...aliasKey(name)];
  const left = EDGE.test(chars[0]!) ? "(?<![a-z0-9])" : "";
  const last = chars.at(-1)!;
  // A series stops only before a letter: a number after it is read by NUMBER_AFTER.
  const right = !EDGE.test(last) ? "" : family ? "(?![a-z])" : /\d/.test(last) ? "(?=cc(?![a-z0-9])|[^a-z0-9]|$)" : "(?![a-z0-9])";
  return new RegExp(left + chars.map(escape).join(SEP) + right, "gi");
}

const NAMES: Array<{ re: RegExp; target: Target }> = [];
const codes = new Map<string, string[]>();
for (const [slug, m] of Object.entries(VEHICLES)) {
  for (const alias of m.aliases) NAMES.push({ re: pattern(alias), target: { kind: "models", slugs: [slug] } });
  for (const code of m.typeCodes ?? []) codes.set(aliasKey(code), [...(codes.get(aliasKey(code)) ?? []), slug]);
}
for (const [code, slugs] of codes) NAMES.push({ re: pattern(code), target: { kind: "models", slugs } });
for (const [id, f] of Object.entries(VEHICLE_FAMILIES)) {
  for (const alias of f.aliases) NAMES.push({ re: pattern(alias, true), target: { kind: "family", id } });
}

interface Span {
  start: number;
  end: number;
  /** On a tie in length: 0 a dictionary model, 1 an unlisted name, 2 a series. */
  rank: number;
  target: Target | null;
}

export function matchVehicles(texts: readonly string[]): VehicleMatch {
  const found: VehicleMatch = { models: new Map(), families: new Map(), unlisted: [] };
  const unlistedKeys = new Set<string>();
  for (const raw of texts) {
    const text = raw.normalize("NFKC");
    const spans: Span[] = [];
    for (const { re, target } of NAMES) {
      for (const m of text.matchAll(re)) {
        const start = m.index, end = start + m[0].length;
        if (target.kind === "models") {
          spans.push({ start, end, rank: 0, target });
          continue;
        }
        const number = NUMBER_AFTER.exec(text.slice(end));
        spans.push(number ? { start, end: end + number[0].length, rank: 1, target: null } : { start, end, rank: 2, target });
      }
    }
    spans.sort((a, b) => b.end - b.start - (a.end - a.start) || a.rank - b.rank || a.start - b.start);
    const kept: Span[] = [];
    for (const s of spans) if (!kept.some((k) => s.start < k.end && k.start < s.end)) kept.push(s);
    for (const s of kept.sort((a, b) => a.start - b.start)) {
      const as = text.slice(s.start, s.end);
      if (!s.target) {
        if (!unlistedKeys.has(aliasKey(as))) found.unlisted.push(as);
        unlistedKeys.add(aliasKey(as));
      } else if (s.target.kind === "models") {
        for (const slug of s.target.slugs) if (!found.models.has(slug)) found.models.set(slug, as);
      } else if (!found.families.has(s.target.id)) {
        found.families.set(s.target.id, as);
      }
    }
  }
  return found;
}
