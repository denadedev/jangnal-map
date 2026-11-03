import type { Metadata } from "next";

import { MobileTabBar } from "../../components/mobile-tab-bar";
import { Icon } from "../../components/icon";
import { flyerPagePath, flyerViewerPath, flyerWeekOf, koreaToday, parseIsoDate } from "../../lib/flyers";
import { getPatternForDate } from "../../lib/jangnal-dates";
import { flyerEndingLabel, formatWeekDay, loadBrandFlyers } from "../../lib/this-week";
import { SITE_OPEN_GRAPH } from "../../lib/site-config";
import styles from "./this-week.module.css";

// 요청 때 그린다. 전단은 DB에서 읽는다.
export const dynamic = "force-dynamic";

// 전단 이미지는 마트의 것이라 검색에 내보내지 않는다 (2026-10-29 결정). sitemap에도 넣지 않는다.
const TITLE = "마트 전단 · 이번 주 대형마트 전단 | 오늘 장날";
const DESCRIPTION = "이번 주 이마트·홈플러스·롯데마트 전단을 한곳에서 넘겨 보세요.";
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: "/this-week" },
  openGraph: { ...SITE_OPEN_GRAPH, title: TITLE, description: DESCRIPTION, url: "/this-week" },
};

const scopeLabel = (baseStoreName: string | null) => baseStoreName ? `기준 매장 ${baseStoreName}` : "전국 공통";

export default async function FlyersPage() {
  const now = new Date();
  const today = koreaToday(now);
  const week = flyerWeekOf(today);
  const brands = await loadBrandFlyers(now);
  const ending = flyerEndingLabel(today, week.end);
  const [endDate, endDay] = formatWeekDay(week.end).split(" ");
  const pattern = getPatternForDate(parseIsoDate(today)!).replace("-", "·");

  return (
    <div className={styles.page}>
      {ending === "오늘 끝나요" ? (
        <p className={styles.lastDay}><Icon name="alert" />오늘이 마지막 날 · 내일 새 전단</p>
      ) : null}
      <main className={styles.main}>
        <h1 className="tab-page-title">마트 전단</h1>
        <p className={styles.period}>
          <span className="jn">{endDate}</span> {endDay}까지{ending ? <> · <strong className={styles.ending}>{ending}</strong></> : null}
        </p>
        <p className={styles.caveat}>점포마다 상품과 가격이 다를 수 있어요</p>

        {brands.filter((brand) => brand.flyer).map(({ code, name, officialFlyerUrl, flyer }) => (
          <section key={code} className={styles.brand} aria-labelledby={`brand-${code}`}>
            <div className={styles.brandHead}>
              <h2 id={`brand-${code}`}>{name}<span className={styles.sub}>{scopeLabel(flyer!.baseStoreName)}</span></h2>
              <a className={styles.count} href={flyerViewerPath(code)}><span className="jn">{flyer!.pages.length}</span>쪽 ›</a>
            </div>
            <ul className={styles.rail}>
              {flyer!.pages.map((page, index) => (
                <li key={page.id}>
                  <a className={styles.railPage} href={`${flyerViewerPath(code)}#page-${index + 1}`}>
                    <img src={flyerPagePath(page.id)} width={page.width} height={page.height} alt={`${name} 전단 ${index + 1}쪽`} loading={index === 0 ? "eager" : "lazy"} />
                    <span className={`${styles.railBadge} jn`}>{index + 1}/{flyer!.pages.length}</span>
                  </a>
                </li>
              ))}
            </ul>
            <a className={styles.textLink} href={officialFlyerUrl} target="_blank" rel="noopener">출처: {name} 공식 전단 ↗</a>
          </section>
        ))}

        {brands.some((brand) => !brand.flyer) ? (
          <div className={styles.pendingList}>
            {brands.filter((brand) => !brand.flyer).map(({ code, name, officialFlyerUrl }) => (
              <p key={code} className={styles.pending}>
                <span>{name} · 이번 주 전단 준비 중 ·</span>
                <a className={styles.textLink} href={officialFlyerUrl} target="_blank" rel="noopener">공식 전단 ↗</a>
              </p>
            ))}
          </div>
        ) : null}

        {brands.length === 0 ? <p className={styles.empty}>지금은 전단을 불러오지 못했어요. 잠시 뒤에 다시 열어 주세요.</p> : null}

        <a className={styles.mapLine} href="/">오늘 <span className="jn">{pattern}</span>장이 열려요 · 지도에서 보기 ›</a>
      </main>
      <MobileTabBar active="week" />
    </div>
  );
}
