// The head of the 厳選 page: how the site's models turn the day's flow of reports into the few worth
// reading — collected, screened and scored, written up and grouped, selected — with the last 24 hours'
// numbers (/api/site/stats). Desktop: a plate drawn like a manual's title page (the survey map, one set of 45°
// bands running behind a mass block of the day's figures) over a strip of the four stages. Phones: one
// compact row, so the feed still starts on the first screen.
import type { SiteStats } from "@hotmoto/contracts/site";
import { ITEM_COPY, REPORTS, SITE } from "@hotmoto/site";
import { CropMarks, Drawing, PlusRow, ShearBands } from "../../components/ui/Graphic";

interface Stage {
  no: string;
  title: string;
  /** A figure from the stats; stages without one (or without stats) describe themselves instead. */
  figure: string | null;
  text: string;
}

const count = (n: number) => n.toLocaleString("en-US");

/** The share of the day's reports that made the selection, as "4.2%" (none when nothing was collected). */
function passRate(stats: SiteStats): string | null {
  if (stats.day.collected <= 0) return null;
  const pct = (stats.day.selected / stats.day.collected) * 100;
  return `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;
}

function stagesOf(stats: SiteStats | null): Stage[] {
  const rate = stats && passRate(stats);
  return [
    {
      no: "01",
      title: "収集",
      figure: stats && count(stats.day.collected),
      text: stats ? `${count(stats.sources)}${REPORTS.metricUnits.sourcesCount}を巡回` : "情報源を巡回し、新しい記事を集める",
    },
    { no: "02", title: "AI 選別・採点", figure: null, text: "業界との関連と情報の実質を見極め、独立に 2 回採点する" },
    { no: "03", title: "AI 執筆・統合", figure: null, text: `要約と${ITEM_COPY.reasonLabel}を書き、同じ出来事の報道を一つにまとめる` },
    { no: "04", title: "厳選", figure: stats && count(stats.day.selected), text: rate ? `通過率 ${rate}` : "基準を超えたものだけが厳選に" },
  ];
}

export function PipelineHero({ stats, title }: { stats: SiteStats | null; title: string }) {
  const stages = stagesOf(stats);
  const rate = stats && passRate(stats);
  return (
    <section aria-labelledby="pipeline-title" className="hidden lg:block">
      <div className="card cut-lg relative mb-6 overflow-hidden">
        <div className="relative h-[232px]">
          <Drawing of="map" fit="cover" at="30% 40%" tone="line" className="absolute inset-0" />
          <ShearBands at={0.6} streaks />
          {/* The heavy block: the day's figures, printed on mass. */}
          {stats && (
            <div className="mass-face absolute bottom-0 right-0 top-0 flex w-[300px] flex-col justify-between px-6 py-5 xl:w-[340px]">
              <div className="flex items-center justify-between">
                <span className="t-micro">24H / FIELD COUNT</span>
                <span className="t-micro flex items-center gap-1.5 text-signal-on-mass">
                  <span className="size-2 animate-pulse bg-signal-on-mass" aria-hidden="true" />
                  過去 24 時間
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-5">
                <div>
                  <dt className="t-micro">収集</dt>
                  <dd className="t-display mt-1 text-[40px] leading-none">{count(stats.day.collected)}</dd>
                </div>
                <div>
                  <dt className="t-micro text-signal-on-mass">厳選</dt>
                  <dd className="t-display mt-1 text-[40px] leading-none text-signal-on-mass">{count(stats.day.selected)}</dd>
                </div>
              </dl>
              <div className="flex items-end justify-between border-t border-on-mass pt-2">
                <span className="t-micro">PASS RATE {rate ?? "—"}</span>
                <PlusRow count={3} />
              </div>
            </div>
          )}
          <div className="relative flex h-full max-w-[46%] flex-col justify-between px-7 py-6">
            <div>
              <div className="t-label inline-flex items-center gap-2 bg-bg pr-2 text-[11px] text-accent">
                <span className="hatch h-2.5 w-6" aria-hidden="true" />
                AI が集めて、選んで、まとめる
              </div>
              <h1 id="pipeline-title" className="t-display mt-3 block w-fit bg-bg pr-3 text-[52px] leading-[1.02] text-ink">
                {title}
              </h1>
              <p className="mt-2 block w-fit bg-bg pr-2 text-[13.5px] text-ink-3">{SITE.tagline}</p>
            </div>
            {stats && (
              <div className="t-micro flex w-fit gap-3 bg-bg pr-2 text-ink-4">
                <span>SRC {count(stats.sources)}</span>
                <span>ITEMS {count(stats.items)}</span>
                <span>SEL {count(stats.selected)}</span>
                <span>DAILY {count(stats.dailies)}</span>
              </div>
            )}
          </div>
          <CropMarks className="text-ink-4" />
        </div>
        <ol className="grid grid-cols-4 border-t border-frame bg-bg-sunk">
          {stages.map((s, i) => (
            <li key={s.no} className={`min-w-0 px-5 pb-4 pt-3 ${i > 0 ? "border-l border-line" : ""}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className={`t-micro ${i === stages.length - 1 ? "text-accent" : "text-ink-4"}`}>{s.no}</span>
                  <span className="truncate text-[13px] font-semibold text-ink">{s.title}</span>
                </span>
                {s.figure !== null && <span className="t-display shrink-0 text-[22px] leading-none text-ink">{s.figure}</span>}
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.6] text-ink-3">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Phones: the day's flow in one row — collected, the models' work, selected. Shown only with stats. */
export function PipelineStrip({ stats }: { stats: SiteStats | null }) {
  if (!stats) return null;
  const rate = passRate(stats);
  return (
    <section aria-label="過去 24 時間の AI 厳選" className="mb-4 mt-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] border border-frame lg:hidden">
      <div className="min-w-0 px-3 py-2">
        <div className="t-micro truncate text-ink-4">24H 収集</div>
        <div className="t-display mt-0.5 text-[20px] leading-none text-ink">{count(stats.day.collected)}</div>
      </div>
      <div className="mass-face relative flex items-center px-3.5 pl-4">
        <span className="absolute inset-y-0 left-0 w-1 bg-signal-on-mass" aria-hidden="true" />
        <span className="t-label text-[11px]">AI 採点</span>
      </div>
      <div className="min-w-0 px-3 py-2 text-right">
        <div className="t-micro truncate text-ink-4">{rate ? `厳選 ${rate}` : "厳選"}</div>
        <div className="t-display mt-0.5 text-[20px] leading-none text-accent">{count(stats.day.selected)}</div>
      </div>
    </section>
  );
}
