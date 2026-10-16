// The review list of model names the vehicle dictionary (industry/vehicles.ts) lacks: what the latest analysis of
// each article found in it, by the number of articles, with the spellings seen. Whether a name becomes an alias
// of a model or a model of its own is a person's call; once the dictionary has it, it leaves the list.
// Usage: node --env-file=.env modules/vehicles/scripts/unlisted.ts [--days 30] [--limit 50]
import { parseArgs } from "node:util";
import { closeDb, sql } from "@hotmoto/backend/db";
import { aliasKey } from "@hotmoto/industry/vehicles";
import { dictionaryKnows } from "../backend/field.ts";

const { values } = parseArgs({ options: { days: { type: "string", default: "30" }, limit: { type: "string", default: "50" } } });
const days = Number(values.days), limit = Number(values.limit);
if (!Number.isInteger(days) || days < 1 || !Number.isInteger(limit) || limit < 1) throw new Error("--days and --limit take positive whole numbers");

const rows = await sql<{ article_id: string; name: string; created_at: Date }[]>`
  SELECT a.article_id, n.name, a.created_at
  FROM (SELECT DISTINCT ON (article_id) article_id, output, created_at FROM analyses
        WHERE created_at > now() - make_interval(days => ${days}) ORDER BY article_id, id DESC) a
  CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(a.output #> '{fields,vehicles,unlisted}', '[]'::jsonb)) AS n(name)`;
await closeDb();

interface Group { spellings: Map<string, number>; articles: string[]; last: Date }
const groups = new Map<string, Group>();
for (const r of rows) {
  if (dictionaryKnows(r.name)) continue;
  const g: Group = groups.get(aliasKey(r.name)) ?? { spellings: new Map(), articles: [], last: r.created_at };
  g.spellings.set(r.name, (g.spellings.get(r.name) ?? 0) + 1);
  if (!g.articles.includes(r.article_id)) g.articles.push(r.article_id);
  if (r.created_at > g.last) g.last = r.created_at;
  groups.set(aliasKey(r.name), g);
}

const list = [...groups.values()].sort((a, b) => b.articles.length - a.articles.length || b.last.getTime() - a.last.getTime()).slice(0, limit);
console.log(`辞書にない車種名：過去 ${days} 日の分析で ${groups.size} 件（記事の数の多い順に ${list.length} 件）`);
for (const g of list) {
  const spellings = [...g.spellings].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  console.log(`${String(g.articles.length).padStart(4)} 記事  ${spellings.join(" / ")}  最後 ${g.last.toISOString().slice(0, 10)}  例 ${g.articles.slice(0, 3).join(", ")}`);
}
