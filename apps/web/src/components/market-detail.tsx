"use client";

import { useEffect, useState } from "react";

import type { PublicMarket } from "../lib/market";
import type { Locale } from "../lib/locale";
import { getDday, formatKoreanDate, formatMarketType, toIsoDate } from "../lib/market-view";
import { getMarketDates, getNextMarketDate } from "../lib/schedule";
import { getUiCopy } from "../lib/ui-copy";
import { MarketDirectionsMenu } from "./market-directions-menu";
import { MarketShareButton } from "./market-share-button";
import { OnnuriSummary } from "./onnuri-summary";

interface MarketDetailProps {
  locale?: Locale;
  market: PublicMarket | null;
  detailPath?: string;
  sharePath?: string;
  today: Date;
  selectedDate?: Date;
  onVisitDateChange?: (date: string) => void;
  onClose: () => void;
}

const formatSourceDate = (value: string | null, locale: Locale): string => {
  if (!value) return getUiCopy(locale).sourceDateMissing;
  return locale === "en" ? value : value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
};

export function MarketDetail({ locale = "ko", market, detailPath, sharePath, today, selectedDate, onVisitDateChange, onClose }: MarketDetailProps) {
  const ui = getUiCopy(locale);
  const [monthOffset, setMonthOffset] = useState(0);
  useEffect(() => setMonthOffset(0), [market?.id, selectedDate?.getTime()]);
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
    ? locale === "en" ? null : ui.operatingToday
    : dday === null
      ? null
      : dday === 0
        ? ui.marketDayToday
        : `D-${dday}`;
  const visitIsMarketDay = selectedDate ? getMarketDates(market, { start: selectedDate, end: selectedDate }).length > 0 : false;
  const visitDateState = !selectedDate || market.schedule.kind === "unknown" ? "" : visitIsMarketDay ? "is-market-day" : "is-not-market-day";
  const baseMonth = selectedDate ?? today;
  const calendarMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthOffset, 1);
  const calendarMonthNameEn = new Intl.DateTimeFormat("en-US", { month: "long" }).format(calendarMonth);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const monthMarketDays = new Set(getMarketDates(market, { start: calendarMonth, end: monthEnd }).map((date) => date.getDate()));

  return (
    <article className="market-detail" aria-label={locale === "en" ? `${market.name} details` : `${market.name} 상세정보`}>
      <div className="sheet-handle" aria-hidden="true" />
      <button type="button" className="detail-close" aria-label={ui.closeDetail} onClick={onClose}>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
      </button>

      <header className="detail-header">
        <p lang={locale === "en" && marketTypeLabel === market.marketType ? "ko" : undefined}>{marketTypeLabel}</p>
        <h2>{detailPath ? <a href={detailPath}><span lang="ko">{market.name}</span>{locale === "en" ? " (Korean)" : ""}</a> : <span lang="ko">{market.name}</span>}</h2>
        <span lang={market.roadAddress || market.lotAddress ? "ko" : undefined}>{address}</span>
      </header>

      <section className={`next-date-card selected-date-card ${visitDateState}`} aria-label={locale === "en" ? "Your selected travel date" : "선택한 방문 날짜"}>
          <div>
            <p>{locale === "en" ? "Your selected travel date" : "선택한 방문 날짜"}</p>
            <strong>{selectedDate ? formatKoreanDate(selectedDate, locale) : locale === "en" ? "Choose a visit date" : "아직 선택하지 않았어요"}</strong>
            <span className="visit-date-verdict">{!selectedDate
              ? locale === "en" ? "Select a date to check the market schedule." : "날짜를 고르면 그날의 운영 일정을 알려드려요."
              : market.schedule.kind === "unknown"
              ? ui.scheduleUnconfirmed
              : market.schedule.kind === "daily"
                ? locale === "en" ? "Regular daily schedule" : "상설시장 · 매일 운영 일정"
                : visitIsMarketDay
                  ? locale === "en" ? "Market day on your selected date" : "이날 5일장이 열려요"
                  : locale === "en" ? "No periodic market day on this date" : "이날은 5일장이 아니에요"}</span>
            {market.schedule.kind === "digit-pair" && !visitIsMarketDay && market.marketType.startsWith("상설") ? (
              selectedDate ? <small>{locale === "en" ? "Permanent stalls may still operate; check with the market before visiting." : "상설 점포는 운영할 수 있어요. 방문 전 확인해 주세요."}</small> : null
            ) : null}
            {onVisitDateChange ? <label className="detail-visit-date-control">
              {locale === "en" ? "Choose visit date" : "방문 날짜 선택"}
              <input type="date" aria-label={locale === "en" ? "Choose visit date" : "방문 날짜 선택"} min={toIsoDate(today)} value={selectedDate ? toIsoDate(selectedDate) : ""} onChange={(event) => onVisitDateChange(event.target.value)} />
            </label> : null}
          </div>
        </section>

      <section className="next-date-card" aria-labelledby="next-market-date">
        <div>
          <p id="next-market-date">{market.schedule.kind === "digit-pair" ? locale === "en" ? "Next market day from today" : "오늘 기준 다음 장날" : timingTitle}</p>
          <strong>{timingText}</strong>
        </div>
        {timingBadge ? <span className="dday">{timingBadge}</span> : null}
      </section>

      <section className="source-summary" aria-label={locale === "en" ? "Market day source" : "장날 정보의 근거"}>
        <strong>{locale === "en" ? "Market day source" : "장날 정보의 근거"}</strong>
        <a href={market.source.url} target="_blank" rel="noreferrer" lang="ko">{market.source.name}</a>
        <p>{ui.sourceDate} {formatSourceDate(market.referenceDate ?? market.source.referenceDate, locale)}{locale === "en" ? " · Not the latest on-site verification date." : " · 현장 최종 확인일이 아닙니다."}</p>
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
              const isSelected = Boolean(selectedDate && selectedDate.getFullYear() === calendarMonth.getFullYear() && selectedDate.getMonth() === calendarMonth.getMonth() && selectedDate.getDate() === day);
              const label = locale === "en"
                ? `${calendarMonthNameEn} ${day}, ${calendarMonth.getFullYear()}${isMarketDay ? ", market day" : ""}${isSelected ? ", selected visit date" : ""}`
                : `${calendarMonth.getFullYear()}년 ${calendarMonth.getMonth() + 1}월 ${day}일${isMarketDay ? ", 장날" : ""}${isSelected ? ", 선택한 방문 날짜" : ""}`;
              return (
                <li key={day} className={`${isMarketDay ? "is-market-day" : ""} ${isSelected ? "is-selected" : ""}`.trim()}>
                  <time dateTime={`${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`} aria-label={label} aria-current={isSelected ? "date" : undefined}>
                    {day}{locale === "ko" ? "일" : ""}
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
          {hasCoordinates ? <MarketDirectionsMenu market={market} locale={locale} className="primary-button" /> : null}
          <MarketShareButton locale={locale} market={market} sharePath={sharePath} today={today} selectedDate={selectedDate} className="market-action-secondary" />
        </div>
      </section>

      <div className="detail-section">
        <OnnuriSummary locale={locale} marketName={market.name} summary={market.onnuri} headingLevel={3} />
      </div>

      <footer className="source-note">
        <a className="report-link" href={`/report?kind=market&market=${encodeURIComponent(market.id)}`}>
          {ui.reportCorrection}
        </a>
      </footer>
    </article>
  );
}
