// The products shelf: every item the prefilter set aside (ASIDE) in the last 90 days, newest first, in one
// list. News, plain BLOCKs, older asides and an aside an editor passed back to the news stay out.
import { tag } from "../../../tests/setup.ts";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { closeDb, sql } from "@hotmoto/backend/db";
import { installModules } from "@hotmoto/backend/modules";
import { upsertMaterial } from "@hotmoto/backend/content/materials";
import { publishArticle } from "@hotmoto/backend/publication/publish";
import products from "../server.ts";
import type { ProductsPage } from "../types.ts";

installModules([products]);
const { buildApp } = await import("../../../apps/api/src/app.ts");

const T = tag();
const SOURCE = `products-${T}`;
const app = await buildApp();
const ids: Record<string, string> = {};

async function item(name: string, relevance: "pass" | "block", label: string, hoursAgo: number) {
  const { articleId } = await upsertMaterial({ sourceId: SOURCE, url: `https://example.org/${T}/${name}`, title: `${T} ${name}`,
    bodyText: "A motorcycle item.", bodyStatus: "ok", via: "fetch", publishedAt: new Date(Date.now() - hoursAgo * 3600_000) });
  await sql`INSERT INTO analyses(article_id,input_revision,origin,relevance,category,tags,title_zh,summary_zh,score,selected,output)
    VALUES (${articleId},1,'model',${relevance},null,'{}',${`${T} ${name} の記事`},${relevance === "pass" ? "二輪の記事。" : ""},null,false,
      ${sql.json({ prefilter: { label, reason: "テスト" } })})`;
  await publishArticle(articleId);
  ids[name] = articleId;
}

before(async () => {
  await sql`INSERT INTO sources(id,name,kind,tier,participation_mode,tags,next_fetch_at) VALUES
    (${SOURCE},'Media','rss','T2','editorial','{}','2100-01-01')`;
  await item("sale", "block", "ASIDE", 1);
  await item("parts", "block", "ASIDE", 5);
  await item("news", "pass", "PASS", 2);
  await item("offtopic", "block", "BLOCK", 3);
  await item("old", "block", "ASIDE", 4);
  await sql`UPDATE publications SET timeline_at = now() - interval '91 days' WHERE article_id = ${ids.old!}`;
  await item("passed-back", "block", "ASIDE", 6);
  await sql`INSERT INTO editorial_overrides(article_id,fields,reason,updated_by) VALUES (${ids["passed-back"]!},'{"relevance":"pass"}','news after all','test')`;
  await publishArticle(ids["passed-back"]!);
});
after(async () => { await app.close(); await closeDb(); });

const named = (items: Array<{ id: string }>) => items.map((i) => Object.keys(ids).find((k) => ids[k] === i.id));

test("the shelf lists the last 90 days of asides, newest first, with their own titles", async () => {
  const res = await app.inject({ method: "GET", url: "/api/site/products" });
  assert.equal(res.statusCode, 200);
  const body = res.json() as ProductsPage;
  assert.equal(body.days, 90);
  // Other tests' asides may share the database: only this file's items are compared.
  const mine = body.items.filter((i) => Object.values(ids).includes(i.id));
  assert.deepEqual(named(mine), ["sale", "parts"], "news, a plain BLOCK, an aside older than 90 days and one passed back stay out");
  assert.equal(mine[0]!.title, `${T} sale の記事`);
  assert.equal(mine[0]!.summary, null);
});

test("set-aside items are not in すべてのニュース", async () => {
  const [row] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM publications WHERE article_id IN ${sql([ids.sale!, ids.parts!])} AND eligible`;
  assert.equal(row!.n, 0);
  const [news] = await sql<{ aside: boolean; eligible: boolean }[]>`SELECT aside, eligible FROM publications WHERE article_id = ${ids.news!}`;
  assert.deepEqual([news!.aside, news!.eligible], [false, true]);
});
