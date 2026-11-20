import { ITEM_COPY } from "@hotmoto/site";

/**
 * The AI score as a small instrument tag, its tier shown by fill rather than hue: strong picks (85+) on the
 * signal inside a mass edge, solid ones (70+) on mass, the rest in a hairline edge. The score itself is unchanged.
 */
const TIERS = [
  { min: 85, className: "border-2 border-mass bg-signal text-on-signal" },
  { min: 70, className: "border border-mass bg-mass text-on-mass" },
  { min: 0, className: "border border-line-strong text-ink-3" },
];

/** The score readers see: none when the site keeps scores from them. */
export function shownScore(score: number | null): number | null {
  return ITEM_COPY.showScore ? score : null;
}

/** "AI スコア | 88" on desktop cards; `compact` keeps only the number (phones). */
export function ScoreLabel({ score, compact = false }: { score: number | null; compact?: boolean }) {
  const shown = shownScore(score);
  if (shown === null) return null;
  const value = Math.round(shown);
  const tier = TIERS.find((t) => value >= t.min)!;
  return (
    <span
      title={`AI スコア ${value}/100`}
      aria-label={`AI スコア ${value} 点`}
      className={`inline-flex h-[22px] shrink-0 items-center gap-1.5 whitespace-nowrap px-1.5 ${tier.className}`}
    >
      {!compact && (
        <>
          <span className="t-label text-[10px] leading-none tracking-[0.1em]">AI スコア</span>
          <span className="h-2.5 w-px bg-current" aria-hidden="true" />
        </>
      )}
      <span className="t-data text-[12.5px] font-bold leading-none">{value}</span>
    </span>
  );
}
