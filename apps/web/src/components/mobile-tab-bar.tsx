"use client";

import { useEffect, useState } from "react";

import { Icon, type IconName } from "./icon";
import { trackEvent } from "./install-prompt";
import { readStorage, writeStorage } from "./market-highlights";

export type MobileTab = "map" | "week" | "stories" | "more";

const TABS: { tab: MobileTab; href: string; label: string; icon: IconName }[] = [
  { tab: "map", href: "/", label: "지도", icon: "map" },
  { tab: "week", href: "/this-week", label: "이번 주", icon: "calendar" },
  { tab: "stories", href: "/stories", label: "장 이야기", icon: "chat" },
  { tab: "more", href: "/more", label: "더보기", icon: "dots" },
];

/** 이번 주 탭을 열었을 때 걸려 있던 전단 id들(쉼표로 이음). */
const SEEN_FLYERS_KEY = "jangnal:seen-flyers";

/** 지금 걸린 전단 가운데 이번 주 탭에서 아직 못 본 것이 있는지. 이번 주 탭에서는 본 것으로 적는다. */
function useNewFlyer(active: MobileTab): boolean {
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/flyers/current")
      .then((response) => response.ok ? response.json() as Promise<{ key: string | null }> : { key: null })
      .catch(() => ({ key: null }))
      .then(({ key }) => {
        if (cancelled || !key) return;
        if (active === "week") {
          writeStorage(SEEN_FLYERS_KEY, key);
          return;
        }
        const seen = new Set((readStorage(SEEN_FLYERS_KEY) ?? "").split(","));
        setIsNew(key.split(",").some((id) => !seen.has(id)));
      });
    return () => { cancelled = true; };
  }, [active]);
  return isNew;
}

/** 한국어 모바일의 하단 탭 4개. 지도·이번 주·장 이야기·더보기 화면에만 둔다. */
export function MobileTabBar({ active }: { active: MobileTab }) {
  const newFlyer = useNewFlyer(active);
  return (
    <nav className="mobile-tab-bar" aria-label="주요 화면">
      {TABS.map(({ tab, href, label, icon }) => (
        <a
          key={tab}
          className="mobile-tab"
          href={href}
          aria-current={tab === active ? "page" : undefined}
          onClick={() => trackEvent("nav-tab", { tab })}
        >
          <Icon name={icon} />
          <span>{label}</span>
          {tab === "week" && newFlyer ? <><span className="mobile-tab-dot" aria-hidden="true" /><span className="sr-only">새 전단</span></> : null}
        </a>
      ))}
    </nav>
  );
}
