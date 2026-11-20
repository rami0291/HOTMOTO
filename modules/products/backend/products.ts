// The products shelf, read through the public layer: every item the prefilter set aside (ASIDE) in the
// last PRODUCTS_DAYS days, newest first, with the cards of すべてのニュース. They are no news, so no
// other list, feed or api carries them.
import { sql } from "@hotmoto/backend/db";
import { ITEM_COLUMNS, ITEM_FROM, toFeedItemSummary, type ItemRow } from "@hotmoto/backend/publication/items";
import { asideCondition } from "@hotmoto/backend/publication/scope";
import type { ProductsPage } from "../types.ts";

export const PRODUCTS_DAYS = 90;

export async function loadProducts(query: { now?: Date } = {}): Promise<ProductsPage> {
  const now = query.now ?? new Date();
  const rows = await sql<ItemRow[]>`
    WITH shelf AS (SELECT p.article_id FROM publications p WHERE ${asideCondition(now, PRODUCTS_DAYS)})
    SELECT ${ITEM_COLUMNS} ${ITEM_FROM} WHERE p.article_id IN (SELECT article_id FROM shelf)
    ORDER BY p.timeline_at DESC, p.article_id DESC`;
  return { days: PRODUCTS_DAYS, items: rows.map(toFeedItemSummary) };
}
