// The products shelf's backend: its api for the page. It stays out of the sitemap: the shelf is ads and
// listings, not the site's news.
import { defineServerModule } from "@hotmoto/backend/modules";
import { sendJsonWithEtag } from "@hotmoto/api/http/respond";
import { siteHandler } from "@hotmoto/api/routes/site";
import { loadProducts } from "./backend/products.ts";

export default defineServerModule({
  name: "products",
  http: (app) => {
    app.get("/api/site/products", siteHandler(async (req, reply) =>
      sendJsonWithEtag(req, reply, await loadProducts(), { etagPrefix: "products", cacheControl: "public, max-age=60, s-maxage=60" })));
  },
});
