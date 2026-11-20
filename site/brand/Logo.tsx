// サイトの文字ロゴとマーク：ページは Wordmark でサイト名を描き（size は高さ、単位はピクセル）、RingMark は小さな照準のマークで、回すと読み込み中の表示になる。
// ここではサイト名を文字で組んでいる（Archivo 900 を 125% に広げた大文字、前に切り欠きの信号色のブロック）。
// 自分のロゴがあるときは、Wordmark を自分の SVG に差し替える（引数は同じに保つ）。site/brand の logo.svg、favicon、アイコンは
// この SignalBlock と同じ形を scripts/icons.ts で書き出したもの。形を変えたら両方を直す。
import { SITE } from "../site.ts";

/** The block in front of the name: the signal colour inside a mass edge, chamfered at two corners. */
export function SignalBlock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path d="M1 1H14L19 6V19H6L1 14Z" fill="var(--signal)" stroke="var(--mass)" strokeWidth="2" />
      <path d="M6.5 13.5L13.5 6.5" stroke="var(--mass)" strokeWidth="2" />
    </svg>
  );
}

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  return (
    <span className={`inline-flex items-center leading-none ${className}`} style={{ fontSize: Math.round(size * 0.74), gap: "0.34em" }} aria-label={title} role="img">
      <SignalBlock className="size-[0.92em] shrink-0" />
      <span aria-hidden="true" className="t-display leading-none">{SITE.name}</span>
    </span>
  );
}

/** A reticle; spinning, it is the loader. */
export function RingMark({ className = "", spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g style={spinning ? { transformOrigin: "12px 12px", animation: "spin-slow 1.1s linear infinite" } : undefined}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="10.14 4" />
      </g>
      <path d="M12 1v5M12 18v5M1 12h5M18 12h5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="10" width="4" height="4" fill="currentColor" />
    </svg>
  );
}
