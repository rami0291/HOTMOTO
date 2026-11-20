import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { Link, useLocation, useRevalidator } from "react-router";
import { tabs, type TabKey } from "./nav";
import { noteScreen, rememberedTab, useScreen } from "./screens";
import { markBack } from "./transitions";
import { useChangelogDot } from "./Sidebar";

const subscribe = () => () => {};
const serverTab = () => null;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
/** One grid column per tab, as whole class names the stylesheet can see. */
const COLUMNS: Record<number, string> = { 4: "grid-cols-4", 5: "grid-cols-5" };

/**
 * The phone tab bar (below lg). A page lights the tab it declares; pages reached from several tabs keep
 * the tab the reader came from. Tapping the tab you are on goes back to its first screen (sliding back,
 * as the bar's back button does); on that screen it scrolls to the top, and at the top it reloads the
 * page's data. Articles bring their own toolbar instead.
 */
export function TabBar({ changelogVersion }: { changelogVersion: string | null }) {
  const screen = useScreen();
  const { pathname, key } = useLocation();
  const revalidator = useRevalidator();
  const dot = useChangelogDot(changelogVersion);
  const last = useRef<TabKey | undefined>(undefined);
  const restored = useSyncExternalStore(subscribe, () => rememberedTab(key), serverTab);
  const active = screen.tab ?? restored ?? last.current ?? screen.home;
  useIsoLayoutEffect(() => {
    // Do not overwrite a saved entry with the server fallback before hydration reads this browser's tab.
    if (restored === null) return;
    last.current = active;
    noteScreen(screen.name, key, active);
  }, [active, key, screen.name, restored]);
  if (screen.toolbar) return null;
  const items = tabs();
  return (
    <nav
      aria-label="下部ナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-frame bg-bg pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:hidden"
    >
      {/* A bar docked to the foot; the tab in use is a mass block with the signal tick along its top. */}
      <div className={`mx-auto grid h-[56px] max-w-[640px] gap-px p-1 ${COLUMNS[items.length]}`}>
        {items.map((t) => {
          const on = t.key === active;
          const Icon = t.icon;
          return (
            <Link
              key={t.key}
              to={t.to}
              prefetch="intent"
              aria-current={on ? "page" : undefined}
              viewTransition={on && pathname !== t.to}
              onClick={(event) => {
                if (!on || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                if (pathname !== t.to) return markBack();
                event.preventDefault();
                if (window.scrollY > 0) {
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                } else if (revalidator.state === "idle") {
                  void revalidator.revalidate();
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-[1px] text-[10.5px] transition-[box-shadow,color] duration-200 ${on ? "mass-face font-semibold" : "text-ink-3 active:bg-bg-sunk active:text-ink"}`}
            >
              {on && <span className="absolute inset-x-0 top-0 h-1 bg-signal-on-mass" aria-hidden="true" />}
              <Icon size={21} />
              <span>{t.label}</span>
              {dot && t.changelog && <span className="absolute left-[calc(50%+9px)] top-[7px] size-2 border border-mass bg-signal" aria-label="新しい更新があります" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
