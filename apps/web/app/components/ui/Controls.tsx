import type { ReactNode, SelectHTMLAttributes } from "react";
import { IconCheck, IconChevronDown } from "../icons";

type Variant = "primary" | "secondary";
const VARIANTS: Record<Variant, string> = {
  primary: "signal-face disabled:opacity-45",
  secondary: "plate text-ink-2 hover:text-ink disabled:opacity-50",
};

type Size = "md" | "lg";
const SIZES: Record<Size, string> = { md: "h-11 px-4 text-[13.5px] lg:h-9", lg: "h-11 px-5 text-[14.5px]" };

/** The button's classes, for links that look like buttons: a chamfered plate, the primary on the signal. */
export function buttonClass(variant: Variant = "secondary", size: Size = "md"): string {
  return `inline-flex items-center justify-center gap-1.5 font-semibold tracking-[0.04em] active:translate-y-px ${SIZES[size]} ${VARIANTS[variant]}`;
}

/** Native select as a sunk field, like the site's other controls. */
export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select
        className="sunk h-11 w-full cursor-pointer appearance-none py-0 pl-3.5 pr-8 text-[16px] text-ink-2 outline-none transition-shadow lg:h-8 lg:text-[12.5px]"
        {...rest}
      >
        {children}
      </select>
      <IconChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-4" />
    </span>
  );
}

/**
 * A filter that combines with others: a plate with its own small check box, so a row of them reads
 * as "pick any" rather than the one-of-many `PillTabs` switch.
 */
export function ToggleChip({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`inline-flex h-11 shrink-0 lg:h-8 select-none items-center gap-1.5 whitespace-nowrap pl-2 pr-3.5 text-[13px] font-medium transition-[box-shadow,color] duration-150 active:scale-[0.98] ${on ? "sunk border-ink text-ink" : "plate text-ink-2 hover:text-ink"}`}
    >
      <span aria-hidden="true" className={`inline-flex size-4 items-center justify-center transition-colors duration-150 ${on ? "border-2 border-mass bg-signal text-on-signal" : "border border-line-strong"}`}>
        {on && <IconCheck size={11} strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}
