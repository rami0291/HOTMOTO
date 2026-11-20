import type { ReactNode } from "react";

/** A small spaced label led by a strip of warning tape: トップ, 今日の注目, サイトについて. */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`t-label flex items-center gap-2.5 text-[11.5px] text-accent ${className}`}>
      <span className="hatch h-2.5 w-6" aria-hidden="true" />
      {children}
    </div>
  );
}
