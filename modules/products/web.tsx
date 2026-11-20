// The products shelf on the web: an entry in the sidebar's コンテンツ, and a row on the phone's マイページ.
import type { SVGProps } from "react";
import type { WebModule } from "@hotmoto/web/modules";

/** A price tag, in the stroke of the engine's icons. */
function IconTag({ size = 18, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l7.8 7.8a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0l-7.8-7.8a1 1 0 0 1-.3-.7z" />
      <circle cx="8.2" cy="8.2" r="1.4" />
    </svg>
  );
}

export default {
  name: "products",
  sidebar: { section: "コンテンツ", items: [{ to: "/products", label: "商品", icon: IconTag }] },
  tools: [{ to: "/products", label: "商品", icon: <IconTag /> }],
} satisfies WebModule;
