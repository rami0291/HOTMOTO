// The site's graphic layer: the line drawings under the pages (a survey map, a motorcycle's side
// elevation, a parallel twin's exploded view; made by scripts/drawings.ts), 45° shear bands, crop marks and
// plus rows. Nothing here carries information a reader needs.
import type { CSSProperties } from "react";
import map from "@hotmoto/site/brand/drawings/map.svg?url&no-inline";
import moto from "@hotmoto/site/brand/drawings/moto.svg?url&no-inline";
import engine from "@hotmoto/site/brand/drawings/engine.svg?url&no-inline";

const DRAWINGS = { map, moto, engine } as const;

/**
 * A drawing in one flat colour: the SVG is the mask, the theme gives the ink (`draft`, the light grey of
 * the backdrop, or the darker `line` for a plate that should read). The box sizes and places it.
 */
export function Drawing({ of, tone = "draft", fit = "contain", at = "center", className = "" }: {
  of: keyof typeof DRAWINGS;
  tone?: "draft" | "line";
  fit?: "contain" | "cover";
  at?: string;
  className?: string;
}) {
  const mask = `url("${DRAWINGS[of]}") ${at} / ${fit} no-repeat`;
  return <div aria-hidden="true" className={`pointer-events-none ${tone === "line" ? "bg-line" : "bg-draft"} ${className}`} style={{ mask, WebkitMask: mask }} />;
}

/**
 * One set of 45° bands crossing a box and bleeding off both ends: a wide steel band, then a thin mass rule
 * with the signal strip against it. Place it behind a picture or a heavy block, never under text.
 * `at` is where the set crosses the box's middle, as a share of its width.
 */
export function ShearBands({ at = 0.55, wide = 150, streaks = false, className = "" }: { at?: number; wide?: number; streaks?: boolean; className?: string }) {
  const band = (left: string, width: number, cls: string): CSSProperties & { key: string } => ({ key: cls + left, left, width, top: "-150%", height: "400%" });
  const items = [
    { ...band(`calc(${at * 100}% + 36px)`, wide, "steel"), cls: "bg-steel" },
    { ...band(`calc(${at * 100}% - 2px)`, 10, "mass"), cls: "bg-mass" },
    { ...band(`calc(${at * 100}% - 10px)`, 8, "signal"), cls: "bg-signal" },
    ...(streaks ? [{ ...band(`calc(${at * 100}% + ${wide + 60}px)`, 64, "streaks"), cls: "streaks" }] : []),
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {items.map(({ key, cls, ...style }) => (
        <span key={key} className={`absolute rotate-[var(--angle-shear)] ${cls}`} style={style} />
      ))}
    </div>
  );
}

/** Corner crop marks for a framed figure (the parent is positioned). */
export function CropMarks({ className = "text-ink" }: { className?: string }) {
  const base = "pointer-events-none absolute size-3.5 border-current";
  return (
    <span aria-hidden="true" className={className}>
      <span className={`${base} left-2 top-2 border-l border-t`} />
      <span className={`${base} right-2 top-2 border-r border-t`} />
      <span className={`${base} bottom-2 left-2 border-b border-l`} />
      <span className={`${base} bottom-2 right-2 border-b border-r`} />
    </span>
  );
}

/** A row of plus marks on the 24px pitch. */
export function PlusRow({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} viewBox="0 0 12 12" className="size-3">
          <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="2" />
        </svg>
      ))}
    </span>
  );
}
