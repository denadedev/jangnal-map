import type { Metadata } from "next";

import { formatPatternDigits } from "../../components/jangnal-number";
import { MobileTabBar } from "../../components/mobile-tab-bar";
import { StoryPickerButton } from "../../components/story-picker-button";
import { HIGHLIGHT_CATEGORY_LABELS } from "../../db/codes";
import { loadCatalog } from "../../lib/catalog/load";
import { highlightSubmissionsEnabled } from "../../lib/highlight-submission-handler";
import { formatStoryAge } from "../../lib/market-highlight";
import styles from "./stories.module.css";

// 승인하면 바로 보이도록 요청 때 그린다.
export const dynamic = "force-dynamic";

// 이야기는 시장 상세 페이지에서 검색에 나간다. 모아 보기 화면은 중복이라 내보내지 않는다.
export const metadata: Metadata = {
  title: "장 이야기 · 다녀온 분들이 들려준 이야기 | 오늘 장날",
  description: "전국 5일장과 전통시장을 다녀온 분들이 들려준 이야기를 최근 순으로 모았어요.",
  robots: { index: false, follow: true },
};

const STORY_LIMIT = 50;

export default async function StoriesPage() {
  const now = new Date();
  const catalog = await loadCatalog();
  const stories = catalog.recentHighlights().flatMap((highlight) => {
    const market = catalog.findMarketById(highlight.marketId);
    return market ? [{ highlight, market }] : [];
  }).slice(0, STORY_LIMIT);

  return (
    <div className="tab-page">
      <main className={styles.main}>
        <h1 className="tab-page-title">장 이야기</h1>
        <p className="tab-page-desc">다녀온 분들이 들려준 장 이야기예요</p>
        {highlightSubmissionsEnabled() ? (
          <div className={styles.cta}><StoryPickerButton className={styles.primary} source="stories_tab" /></div>
        ) : null}
        {stories.length === 0 ? <p className={styles.empty}>아직 들려준 이야기가 없어요.</p> : (
          <ul className={styles.list}>
            {stories.map(({ highlight, market }) => {
              const digits = formatPatternDigits(market);
              return (
                <li key={`${highlight.marketId}:${highlight.name}:${highlight.createdAt}`}>
                  <a className={styles.story} href={catalog.toMarketLink(market).href}>
                    <span className={styles.head}>
                      <span className={styles.market}>{market.name}{digits ? <> · <span className="jn">{digits}</span></> : null}</span>
                      <span className={styles.age}>{formatStoryAge(highlight.createdAt, now)}</span>
                    </span>
                    <span className={styles.category}>{HIGHLIGHT_CATEGORY_LABELS[highlight.category]}</span>
                    <strong className={styles.what}>{highlight.name}</strong>
                    {highlight.description ? <span className={styles.description}>{highlight.description}</span> : null}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <MobileTabBar active="stories" />
    </div>
  );
}
