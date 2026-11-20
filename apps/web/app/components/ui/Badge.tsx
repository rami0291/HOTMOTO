import type { ReactNode } from "react";

type Tone = "selected" | "accent" | "amber" | "hot" | "ok" | "neutral";

/** Tags are told apart by fill and edge, not by hue alone: a mass plate for what is fixed, edges for the rest. */
const TONES: Record<Tone, string> = {
  selected: "mass-face",
  accent: "border border-accent text-accent",
  amber: "border border-amber text-amber",
  hot: "border border-hot text-hot",
  ok: "border border-ok text-ok",
  neutral: "border border-line-strong text-ink-3",
};

/** Small square tag next to a source or title: 厳選, statuses and counts. */
export function Badge({ tone = "neutral", dot = false, children, className = "", title }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={`inline-flex h-[18px] shrink-0 items-center gap-1 px-1.5 text-[11px] font-semibold leading-none tracking-[0.04em] ${TONES[tone]} ${className}`}>
      {dot && <span className="size-[5px] bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** The "厳選" mark on a report. */
export function SelectedBadge() {
  return (
    <Badge tone="selected" dot>
      厳選
    </Badge>
  );
}

/** A selected report whose fact is shown by another report (the one holding its selected seat). */
export function SameEventBadge() {
  return <Badge title="同じニュースの厳選の代表がすでにあります">同じニュース</Badge>;
}
