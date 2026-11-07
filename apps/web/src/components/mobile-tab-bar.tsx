"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";

import { Icon, type IconName } from "./icon";
import { trackEvent } from "./install-prompt";
import { readStorage, writeStorage } from "./market-highlights";

export type MobileTab = "map" | "week" | "stories" | "more";

const TABS: { tab: MobileTab; href: string; label: string; icon: IconName }[] = [
  { tab: "map", href: "/", label: "지도", icon: "map" },
  { tab: "week", href: "/this-week", label: "마트 전단", icon: "flyer" },
  { tab: "stories", href: "/stories", label: "장 이야기", icon: "chat" },
  { tab: "more", href: "/more", label: "더보기", icon: "dots" },
];

/** 마트 전단 탭을 열었을 때 걸려 있던 전단 id들(쉼표로 이음). */
const SEEN_FLYERS_KEY = "jangnal:seen-flyers";

/** 탭을 옮길 때마다 다시 묻지 않도록 페이지를 새로 열 때까지 한 번 받은 답을 쓴다. */
let currentFlyerKey: Promise<{ key: string | null }> | null = null;
const fetchCurrentFlyerKey = () => currentFlyerKey ??= fetch("/api/flyers/current")
  .then((response) => response.ok ? response.json() as Promise<{ key: string | null }> : { key: null })
  .catch(() => ({ key: null }));

/** 테스트에서 탭 화면을 새로 연 것처럼 만든다. */
export function resetCurrentFlyerKey(): void {
  currentFlyerKey = null;
}

/** 지금 걸린 전단 가운데 이번 주 탭에서 아직 못 본 것이 있는지. 마트 전단 탭에서는 본 것으로 적는다. */
function useNewFlyer(active: MobileTab): boolean {
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchCurrentFlyerKey()
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

/** 누른 탭은 다음 화면이 오기 전에 바로 켜진 모양으로 바꾼다. */
function TabContent({ icon, label }: { icon: IconName; label: string }) {
  const { pending } = useLinkStatus();
  return <><Icon name={icon} /><span data-pending={pending || undefined}>{label}</span></>;
}

/**
 * 한국어 모바일의 하단 탭 4개. 지도·마트 전단·장 이야기·더보기 화면에만 둔다.
 * 페이지를 통째로 다시 받지 않고 앱 안에서 화면만 바꾼다(next/link).
 */
export function MobileTabBar({ active }: { active: MobileTab }) {
  const newFlyer = useNewFlyer(active);
  return (
    <nav className="mobile-tab-bar" aria-label="주요 화면">
      {TABS.map(({ tab, href, label, icon }) => (
        <Link
          key={tab}
          className="mobile-tab"
          href={href}
          prefetch
          aria-current={tab === active ? "page" : undefined}
          onClick={() => trackEvent("nav-tab", { tab })}
        >
          <TabContent icon={icon} label={label} />
          {tab === "week" && newFlyer ? <><span className="mobile-tab-dot" aria-hidden="true" /><span className="sr-only">새 전단</span></> : null}
        </Link>
      ))}
    </nav>
  );
}
