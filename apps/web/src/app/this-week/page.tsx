import type { Metadata } from "next";

import { MobileTabBar } from "../../components/mobile-tab-bar";
import { SiteFooter } from "../../components/site-footer";
import { StoryPickerButton } from "../../components/story-picker-button";
import { loadCatalog } from "../../lib/catalog/load";
import { flyerPagePath, flyerViewerPath, flyerWeekOf, koreaToday } from "../../lib/flyers";
import { highlightSubmissionsEnabled } from "../../lib/highlight-submission-handler";
import { formatWeekDay, getWeekDays, loadBrandFlyers } from "../../lib/this-week";
import styles from "./this-week.module.css";

// 요청 때 그린다. 전단은 DB에서, 장날은 메모리의 시장 스냅샷에서 읽는다.
export const dynamic = "force-dynamic";

// 진입점을 열기 전(시험 운영)이라 검색에 내보내지 않는다. 공개할 때 index로 바꾸고 sitemap에 넣는다.
export const metadata: Metadata = {
  title: "이번 주 장보기 · 마트 전단과 장날 | 오늘 장날",
  description: "이번 주 대형마트 전단과 요일별 장날을 한곳에서 확인하세요.",
  robots: { index: false, follow: true },
};

const brandSub = (baseStoreName: string | null, pageCount: number) => `${baseStoreName ? `기준 매장 ${baseStoreName}` : "전국 공통"} · ${pageCount}장`;

export default async function ThisWeekPage() {
  const now = new Date();
  const today = koreaToday(now);
  const week = flyerWeekOf(today);
  const [{ periodicMarkets }, brands] = await Promise.all([loadCatalog(), loadBrandFlyers(now)]);
  const days = getWeekDays(periodicMarkets, today);
  const [startDate, startDay] = formatWeekDay(week.start).split(" ");
  const [endDate, endDay] = formatWeekDay(week.end).split(" ");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className="tab-page-title">이번 주 장보기</h1>
        <div className={styles.period}>
          <p className={styles.periodLabel}>이번 주</p>
          <p className={styles.periodValue}>
            <span className="jn">{startDate}</span> <span className={styles.weekday}>{startDay}</span>
            {" ~ "}
            <span className="jn">{endDate}</span> <span className={styles.weekday}>{endDay}</span>
          </p>
        </div>

        {brands.length > 0 ? (
          <section className={styles.sec} aria-labelledby="flyers-heading">
            <h2 id="flyers-heading">마트 전단</h2>
            {brands.filter((brand) => brand.flyer).map(({ code, name, flyer }) => (
              <a key={code} className={styles.brandCard} href={flyerViewerPath(code)}>
                {/* 표지는 첫 쪽 위쪽만 잘라 보여 준다. */}
                <img className={styles.thumb} src={flyerPagePath(flyer!.pages[0].id)} alt="" width={56} height={75} />
                <span className={styles.brandText}>
                  <span className={styles.brandName}>{name}</span>
                  <span className={styles.sub}>{brandSub(flyer!.baseStoreName, flyer!.pages.length)}</span>
                </span>
                <span className={styles.chev} aria-hidden="true">›</span>
              </a>
            ))}
            {brands.filter((brand) => !brand.flyer).map(({ code, name, officialFlyerUrl }) => (
              <p key={code} className={styles.pending}>
                <span>{name} · 이번 주 전단 준비 중 ·</span>
                <a className={styles.textLink} href={officialFlyerUrl} target="_blank" rel="noopener">공식 전단 ↗</a>
              </p>
            ))}
          </section>
        ) : null}

        <section id="days" className={styles.sec} aria-labelledby="days-heading">
          <h2 id="days-heading">이번 주 장날</h2>
          <ul className={styles.days}>
            {days.map((day) => (
              <li key={day.date} className={`${styles.day} ${day.isToday ? styles.isToday : ""}`} aria-current={day.isToday ? "date" : undefined}>
                <span className={styles.dayDate}>{formatWeekDay(day.date)}</span>
                <span className={styles.dayMark}>
                  <span className="jn">{day.pattern.replace("-", "·")}</span>
                  {day.isToday ? <span className={styles.badgeToday}>오늘</span> : null}
                </span>
                <span className={styles.dayCount}>{day.count}곳</span>
              </li>
            ))}
          </ul>
        </section>

        {highlightSubmissionsEnabled() ? (
          <div className={styles.cta}><StoryPickerButton className={styles.primary} source="this_week" /></div>
        ) : null}

        <p className={styles.note}>
          전단은 각 마트가 공개한 전단을 출처와 함께 옮긴 것이에요. 점포마다 상품과 가격이 다를 수 있으니 공식 전단에서 확인해 주세요.
          장날 수는 5일장 기준이에요.
        </p>
      </main>
      <SiteFooter />
      <MobileTabBar active="week" />
    </div>
  );
}
