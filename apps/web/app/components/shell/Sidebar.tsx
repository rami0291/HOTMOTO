import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { SITE } from "@hotmoto/site";
import { Wordmark } from "@hotmoto/site/brand/Logo.tsx";
import { useChangelogSeen } from "../../lib/local-state";
import { sidebar, sidebarIsActive, type NavItem } from "./nav";
import { ThemeSwitch } from "./ThemeSwitch";
import { IconGithub } from "../icons";
import { Drawing } from "../ui/Graphic";

/** True while the changelog has an entry newer than the one this reader last opened. */
export function useChangelogDot(latestVersion: string | null): boolean {
  const seen = useChangelogSeen();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !latestVersion) return false;
  return !seen || seen < latestVersion;
}

/** A sidebar row: its number, icon and name; the page you are on is a mass block with the signal tick at its edge. */
function SideLink({ item, index, dot }: { item: NavItem; index: number; dot: boolean }) {
  const { pathname } = useLocation();
  const isActive = sidebarIsActive(item, pathname);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      prefetch="intent"
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex h-9 items-center gap-2 pl-2.5 pr-2 text-[13.5px] transition-colors duration-150 ${
        isActive ? "mass-face font-semibold" : "font-medium text-ink-3 hover:bg-bg-sunk hover:text-ink"
      }`}
    >
      {isActive && <span className="absolute inset-y-0 left-0 w-1 bg-signal" aria-hidden="true" />}
      <span className={`t-micro w-4 shrink-0 ${isActive ? "text-signal-on-mass" : "text-ink-4"}`} aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <Icon size={15} />
      <span className="min-w-0 truncate">{item.label}</span>
      {dot && item.changelog && <span className="ml-auto size-2 shrink-0 border border-mass bg-signal" aria-label="新しい更新があります" />}
    </Link>
  );
}

export function Sidebar({ changelogVersion }: { changelogVersion: string | null }) {
  const dot = useChangelogDot(changelogVersion);
  let index = 0;
  return (
    <aside className="sticky top-0 hidden h-dvh w-[200px] shrink-0 flex-col border-r border-line bg-bg pb-3 pt-5 lg:flex">
      {/* The engine's exploded view fills the column's foot, under the links. */}
      <Drawing of="engine" at="center bottom" className="absolute inset-x-3 bottom-[132px] top-[44%] -z-10" />
      <Link to="/" className="mb-2 flex h-[50px] items-center px-4 text-ink" aria-label={`${SITE.name} トップ`}>
        <Wordmark size={27} />
      </Link>
      <div className="mx-4 flex items-center justify-between border-y border-line py-1 text-ink-4" aria-hidden="true">
        <span className="t-micro">FIXED-POINT LOG</span>
        <span className="t-micro">JST</span>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2" aria-label="メインナビゲーション">
        {sidebar().map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-4 text-[11px] font-semibold tracking-[0.08em] text-ink-4">
              {section.title}
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-px">
              {section.items.map((item) => (
                <SideLink key={item.to} item={item} index={++index} dot={dot} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2.5 px-4 pt-2">
        <div className="ruler text-line" aria-hidden="true" />
        {SITE.github && (
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="plate flex h-[34px] items-center justify-center gap-1.5 text-[12px] text-ink-3 hover:text-ink"
          >
            <IconGithub size={14} />
            GitHub でオープンソース
          </a>
        )}
        <ThemeSwitch />
        {SITE.icp && (
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="block px-1 text-[10px] text-ink-4 hover:text-ink-3">
            {SITE.icp}
          </a>
        )}
      </div>
    </aside>
  );
}
