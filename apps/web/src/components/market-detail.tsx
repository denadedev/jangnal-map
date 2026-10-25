"use client";

import { useEffect, useState } from "react";

import type { PublicMarket } from "../lib/market";
import type { Locale } from "../lib/locale";
import { getDday, formatKoreanDate, formatMarketType, formatSchedulePattern } from "../lib/market-view";
import { getMarketDates, getNextMarketDate } from "../lib/schedule";
import { getUiCopy } from "../lib/ui-copy";
import { MarketDirectionsMenu } from "./market-directions-menu";
import { MarketHighlights, MarketHighlightsTeaser, type HighlightMarketRef } from "./market-highlights";
import { MarketShareButton } from "./market-share-button";
import { OnnuriSummary } from "./onnuri-summary";
import { formatPatternDigits } from "./jangnal-number";
import { Icon } from "./icon";

interface MarketDetailProps {
  locale?: Locale;
  mobile?: boolean;
  market: PublicMarket | null;
  detailPath?: string;
  sharePath?: string;
  today: Date;
  onClose: () => void;
  /** 방문자 제보를 받을 수 있는지. false면 제보 버튼을 숨긴다. */
  submissionsEnabled?: boolean;
  /** 제보를 마친 뒤 이어서 제보하도록 보여 줄 같은 지역 시장. */
  nearbyMarkets?: HighlightMarketRef[];
  /** 지도의 "새 이야기"로 들어왔을 때 강조할 방문자 이야기 이름. */
  focusHighlight?: string;
}

const formatSourceDate = (value: string | null, locale: Locale): string => {
  if (!value) return getUiCopy(locale).sourceDateMissing;
  return locale === "en" ? value : value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
};

export function MarketDetail({ locale = "ko", mobile = false, market, detailPath, sharePath, today, onClose, submissionsEnabled, nearbyMarkets, focusHighlight }: MarketDetailProps) {
  const ui = getUiCopy(locale);
  const [monthOffset, setMonthOffset] = useState(0);
  useEffect(() => setMonthOffset(0), [market?.id]);
  if (!market) {
    return (
      <div className="detail-placeholder">
        <span className="detail-placeholder-pin" aria-hidden="true" />
        <p>{ui.selectedMarketPrompt}</p>
        <strong>{ui.selectedMarketHelp}</strong>
      </div>
    );
  }

  const nextDate = getNextMarketDate(market, today);
  const dday = nextDate ? getDday(nextDate, today) : null;
  const address = market.roadAddress ?? market.lotAddress ?? ui.addressMissing;
  const marketTypeLabel = formatMarketType(market.marketType, locale);
  const hasCoordinates = market.latitude !== null && market.longitude !== null;
  const timingTitle = market.schedule.kind === "digit-pair" ? ui.nextMarketDay : ui.scheduleLabel;
  const timingText = market.schedule.kind === "daily"
    ? ui.dailySchedule
    : market.schedule.kind === "unknown"
      ? ui.scheduleUnconfirmed
      : nextDate
        ? formatKoreanDate(nextDate, locale)
        : ui.scheduleUnconfirmed;
  const timingBadge = market.schedule.kind === "daily"
    ? null
    : dday === null
      ? null
      : dday === 0
        ? ui.marketDayToday
        : `D-${dday}`;
  const calendarMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const calendarMonthNameEn = new Intl.DateTimeFormat("en-US", { month: "long" }).format(calendarMonth);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const monthMarketDays = new Set(getMarketDates(market, { start: calendarMonth, end: monthEnd }).map((date) => date.getDate()));

  return (
    <article className="market-detail" aria-label={locale === "en" ? `${market.name} details` : `${market.name} 상세정보`}>
      <div className="sheet-handle" aria-hidden="true" />
      <button type="button" className="detail-close" aria-label={ui.closeDetail} onClick={onClose}>
        <Icon name="close" />
      </button>

      <header className="detail-header">
        <p lang={locale === "en" && marketTypeLabel === market.marketType ? "ko" : undefined}>{marketTypeLabel}</p>
        <h2>{detailPath ? <a href={detailPath}><span lang="ko">{market.name}</span>{locale === "en" ? " (Korean)" : ""}</a> : <span lang="ko">{market.name}</span>}</h2>
        <span lang={market.roadAddress || market.lotAddress ? "ko" : undefined}>{address}</span>
      </header>

      {market.schedule.kind === "digit-pair" ? (
        <div className="detail-pattern">
          <b className="jn" aria-hidden="true">{formatPatternDigits(market)}</b>
          <span>
            <small>{locale === "en" ? "Market-day rule" : "장날 규칙"}</small>
            {locale === "en"
              ? `Dates ending in ${market.schedule.days[0]} and ${market.schedule.days[1]}`
              : `날짜 끝자리가 ${market.schedule.days[0]}, ${market.schedule.days[1]}인 날`}
          </span>
        </div>
      ) : null}

      <section className="next-date-card" aria-labelledby="next-market-date">
        <div>
          <p id="next-market-date">{market.schedule.kind === "digit-pair" ? locale === "en" ? "Next market day from today" : "오늘 기준 다음 장날" : timingTitle}</p>
          <strong>{mobile && locale === "ko" && nextDate && market.schedule.kind === "digit-pair"
            ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(nextDate)
            : timingText}</strong>
        </div>
        {mobile && market.schedule.kind === "digit-pair" ? <span className="mobile-timing-pattern">{formatSchedulePattern(market, locale)}</span> : timingBadge ? <span className="dday">{timingBadge}</span> : null}
      </section>
      {market.schedule.kind === "daily" ? <p className="next-date-reference">{locale === "en" ? "Public data lists a daily schedule. Check individual stall opening days and regular market closures before visiting." : "공공데이터에 등록된 상설 일정입니다. 점포별 영업일과 정기휴무는 방문 전 확인하세요."}</p> : null}
      {market.schedule.kind === "digit-pair" ? <p className="next-date-reference">{locale === "en" ? `From today (${formatKoreanDate(today, locale)}).` : `오늘 ${formatKoreanDate(today)} 기준이에요.`}</p> : null}

      {locale === "ko" ? <MarketHighlightsTeaser market={market} scheduleLabel={formatSchedulePattern(market)} submissionsEnabled={submissionsEnabled} nearbyMarkets={nearbyMarkets} /> : null}

      <section className="source-summary" aria-label={locale === "en" ? "Market day source" : "장날 정보의 근거"}>
        <strong>{locale === "en" ? "Market day source" : "장날 정보의 근거"}</strong>
        <a href={market.scheduleSource?.url ?? market.source.url} target="_blank" rel="noreferrer" lang="ko">{market.scheduleSource?.name ?? market.source.name}</a>
        <p>{market.scheduleSource ? locale === "en" ? "Schedule source checked" : "장날 출처 확인일" : ui.sourceDate} {formatSourceDate(market.scheduleSource?.checkedAt ?? market.referenceDate ?? market.source.referenceDate, locale)}{locale === "en" ? " · Not the latest on-site verification date." : " · 현장 최종 확인일이 아닙니다."}</p>
      </section>

      {market.schedule.kind === "digit-pair" ? (
        <section className="detail-section" aria-label={locale === "en" ? "Monthly market days" : "월간 장날"}>
          <div className="section-heading">
            <h3>{locale === "en" ? `${calendarMonth.getFullYear()}-${calendarMonth.getMonth() + 1} market days` : `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월 장날`}</h3>
            <div className="month-navigation">
              <button type="button" aria-label={locale === "en" ? "Previous month" : "이전 달"} onClick={() => setMonthOffset((offset) => offset - 1)}>‹</button>
              <button type="button" aria-label={locale === "en" ? "Next month" : "다음 달"} onClick={() => setMonthOffset((offset) => offset + 1)}>›</button>
            </div>
          </div>
          <div className="month-weekdays" aria-hidden="true">
            {(locale === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["일", "월", "화", "수", "목", "금", "토"]).map((day) => <span key={day}>{day}</span>)}
          </div>
          <ol className="month-calendar" aria-label={locale === "en" ? "Market days this month" : "이달의 장날"}>
            {Array.from({ length: calendarMonth.getDay() }, (_, index) => <li key={`blank-${index}`} aria-hidden="true" />)}
            {Array.from({ length: monthEnd.getDate() }, (_, index) => index + 1).map((day) => {
              const isMarketDay = monthMarketDays.has(day);
              const label = locale === "en"
                ? `${calendarMonthNameEn} ${day}, ${calendarMonth.getFullYear()}${isMarketDay ? ", market day" : ""}`
                : `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월 ${day}일${isMarketDay ? ", 장날" : ""}`;
              return (
                <li key={day} className={isMarketDay ? "is-market-day" : undefined}>
                  <time dateTime={`${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`} aria-label={label}>
                    {day}{locale === "ko" && !mobile ? "일" : ""}
                  </time>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="detail-section" aria-labelledby="visit-info">
        <h3 id="visit-info">{ui.visitInfo}</h3>
        <dl className="info-list">
          <div><dt>{ui.address}</dt><dd lang={market.roadAddress || market.lotAddress ? "ko" : undefined}>{address}</dd></div>
          <div><dt>{ui.phone}</dt><dd>{market.phone ? <a href={`tel:${market.phone}`}>{market.phone}</a> : ui.noInformation}</dd></div>
          <div><dt>{ui.parking}</dt><dd>{market.hasParking === true ? ui.parkingAvailable : market.hasParking === false ? ui.noParking : ui.confirmNeeded}</dd></div>
          {!hasCoordinates ? <div><dt>{ui.map}</dt><dd>{ui.locationMissing}</dd></div> : null}
        </dl>
        <div className={`detail-actions ${hasCoordinates ? "" : "share-only"}`.trim()}>
          {hasCoordinates ? <MarketDirectionsMenu market={market} locale={locale} className="primary-button" mobilePrimary={mobile} label={mobile ? locale === "en" ? "Choose directions" : "길찾기 선택" : undefined} /> : null}
          {!mobile || !hasCoordinates ? <MarketShareButton locale={locale} market={market} sharePath={sharePath} today={today} className="market-action-secondary" /> : null}
        </div>
        {mobile && hasCoordinates ? <div className="mobile-share-action"><MarketShareButton locale={locale} market={market} sharePath={sharePath} today={today} className="market-action-secondary" /></div> : null}
      </section>

      <div className="detail-section">
        <OnnuriSummary locale={locale} marketName={market.name} summary={market.onnuri} headingLevel={3} />
      </div>

      {locale === "ko" ? (
        <div className="detail-section">
          <MarketHighlights marketId={market.id} marketName={market.name} scheduleLabel={formatSchedulePattern(market)} submissionsEnabled={submissionsEnabled} nearbyMarkets={nearbyMarkets} focusName={focusHighlight} headingLevel={3} />
        </div>
      ) : null}

      <footer className="source-note">
        <a className="report-link" href={`/report?kind=market&market=${encodeURIComponent(market.id)}`}>
          {ui.reportCorrection}
        </a>
      </footer>
    </article>
  );
}
