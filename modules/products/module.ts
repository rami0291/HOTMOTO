// The products shelf (/products): what the prefilter set aside from the news (ads, product listings,
// timeless reads), in one list.
import { defineModule } from "@hotmoto/contracts/modules";

export default defineModule({
  name: "products",
  pages: [{ path: "products", file: "web/products.tsx" }],
});
