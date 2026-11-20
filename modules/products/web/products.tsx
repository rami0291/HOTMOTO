// /products: what the prefilter set aside from the news (ads and sales, product listings, timeless reads),
// the last 90 days in one list, newest first. Not indexed: the shelf is not the site's news.
import { useLoaderData, type LoaderFunctionArgs, type MetaArgs } from "react-router";
import { SITE } from "@hotmoto/site";
import { edgeTtl, loadOr404 } from "@hotmoto/web/lib/api.server";
import { pageMeta } from "@hotmoto/web/lib/seo";
import { DayList } from "@hotmoto/web/features/feed/DayList";
import { EmptyState } from "@hotmoto/web/components/ui/Page";
import { PhoneBar } from "@hotmoto/web/components/shell/PhoneBar";
import type { Screen } from "@hotmoto/web/components/shell/screens";
import type { ProductsPage } from "../types.ts";

export const handle: Screen = { name: "商品" };

const TITLE = "バイク商品";
const lead = (days: number) => `広告やセール、用品・パーツの発売、読み物など、ニュースとは分けた記事です。直近 ${days} 日分を新しい順に並べます。`;

export function headers() {
  return edgeTtl(60);
}

export async function loader({ request }: LoaderFunctionArgs) {
  return { data: await loadOr404<ProductsPage>("/api/site/products", { signal: request.signal }) };
}

export function meta({ loaderData }: MetaArgs<typeof loader>) {
  return pageMeta({ title: TITLE, description: `${SITE.name} の商品欄。${lead(loaderData?.data.days ?? 90)}`, path: "/products", noindex: true });
}

export default function ProductsPageView() {
  const { data } = useLoaderData<typeof loader>();
  return (
    <div className="pb-10">
      <PhoneBar title="商品" large sub={lead(data.days)} />
      <header className="hidden pb-4 pt-1 lg:block">
        <h1 className="text-[24px] font-semibold leading-[1.3] text-ink">
          {TITLE}
          <span className="num ml-2 text-[14px] font-normal text-ink-4">{data.items.length} 件</span>
        </h1>
        <p className="mt-1.5 text-[13.5px] text-ink-3">{lead(data.days)}</p>
      </header>
      {data.items.length ? <DayList items={data.items} /> : (
        <div className="lg:card">
          <EmptyState title="商品欄の記事はまだありません">予備選別がニュースと分けた記事（広告、用品・パーツの発売、読み物）がここに入ります。</EmptyState>
        </div>
      )}
    </div>
  );
}
