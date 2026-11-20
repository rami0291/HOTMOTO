// What the products shelf's api (/api/site/products) answers its page.
import type { FeedItemSummary } from "@hotmoto/contracts/site";

export interface ProductsPage {
  /** How far back the shelf reaches. */
  days: number;
  /** Every item set aside in those days, newest first: one list, no pages. */
  items: FeedItemSummary[];
}
