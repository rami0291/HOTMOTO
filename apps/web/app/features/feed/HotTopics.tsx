import { Link } from "react-router";
import type { HotStripEntry } from "@hotmoto/contracts/site";
import { IconArrowRight, IconMinus, IconTrendDown, IconTrendUp } from "../../components/icons";
import { Faces } from "../hot/Faces";

// The top three as filled squares (first on the signal, then mass), the rest in a hairline edge.
const RANK_CHIP = ["border-2 border-mass bg-signal text-on-signal", "mass-face", "mass-face"];

function hrefOf(e: HotStripEntry): string {
  return e.storyPublicId ? `/story/${e.storyPublicId}` : e.itemId ? `/items/${e.itemId}` : "/hot";
}

/** Where the heat is heading, as a small arrow (a "新" mark for a story new to the ranking). */
function TrendMark({ trend }: { trend: HotStripEntry["trend"] }) {
  if (trend === "up") return <IconTrendUp size={14} strokeWidth={2.2} className="text-accent" aria-label="話題度が上昇" />;
  if (trend === "down") return <IconTrendDown size={14} strokeWidth={2.2} className="text-ink-4" aria-label="話題度が低下" />;
  if (trend === "new") return <span className="border border-accent px-1 text-[10.5px] font-semibold leading-4 text-accent">新</span>;
  if (trend === "unknown") return null; // sources behind on collection: no comparison to show
  return <IconMinus size={14} strokeWidth={2.2} className="text-ink-4" aria-label="話題度は横ばい" />;
}

/**
 * The top of the hot ranking on the home page, kept quiet: a live dot, coloured ranks and titles, then
 * columns of fixed width so every row lines up — who is talking (main source faces, from sm), "N 話題度" and an arrow for
 * where it is heading. The whole row lights up on hover. Phones show the top three in one line each, so
 * the feed starts on the first screen.
 */
export function HotTopics({ entries }: { entries: HotStripEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section
      aria-labelledby="hot-topics"
      className="card relative mb-5 overflow-hidden px-3.5 pb-1.5 pt-2.5 lg:mb-7 lg:px-5 lg:pb-2.5 lg:pt-3.5"
    >
      <div className="flex items-center justify-between lg:mb-1">
        <h2 id="hot-topics" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <span className="hatch h-3 w-5" aria-hidden="true" />
          いまの話題
          <span className="t-micro font-normal text-ink-4">HOT / TOP 5</span>
        </h2>
        <Link to="/hot" className="group -my-2 -mr-1.5 inline-flex h-10 items-center gap-1 px-1.5 text-[12.5px] text-ink-3 transition-colors hover:text-accent lg:my-0 lg:mr-0 lg:h-auto lg:px-0">
          ランキング全体 <IconArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ol>
        {entries.slice(0, 5).map((e, i) => (
          <li key={e.rank} className={i >= 3 ? "max-sm:hidden" : undefined}>
            <Link viewTransition
              to={hrefOf(e)}
              className="group -mx-2 grid min-h-10 sm:min-h-0 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 px-2 py-1.5 transition-colors duration-150 hover:bg-bg-sunk sm:grid-cols-[24px_minmax(0,1fr)_120px_64px_20px] sm:gap-x-4 sm:py-2"
            >
              <span className={`t-data grid size-6 place-items-center text-[12px] font-bold leading-none ${RANK_CHIP[i] ?? "border border-line-strong text-ink-3"}`}>{e.rank}</span>
              <span className="line-clamp-1 min-w-0 text-[14.5px] font-semibold leading-[1.5] text-ink transition-colors group-hover:text-accent lg:text-[14px]">{e.title}</span>
              <span className="hidden justify-end sm:flex">
                <Faces participants={e.participants} total={e.participantCount} size={20} interactive={false} />
              </span>
              <span className="flex items-center justify-end gap-2.5 sm:contents">
                <span className="whitespace-nowrap text-right text-[12.5px] text-ink-4" title="話題度指数">
                  <span className="t-data text-[13px] font-semibold text-ink-2">{Math.round(e.heat)}</span> 話題度
                </span>
                <span className="flex w-5 justify-center">
                  <TrendMark trend={e.trend} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
