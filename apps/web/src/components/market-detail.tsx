"use client";

import { useEffect, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import type { Locale } from "../lib/locale";
import { getDday, formatKoreanDate, formatMarketType, formatSchedulePattern, toIsoDate } from "../lib/market-view";
import { getMarketDates, getNextMarketDate } from "../lib/schedule";
import { getUiCopy } from "../lib/ui-copy";
import { MarketDirectionsMenu } from "./market-directions-menu";
import { MarketShareButton } from "./market-share-button";
import { OnnuriSummary } from "./onnuri-summary";

interface MarketDetailProps {
  locale?: Locale;
  mobile?: boolean;
  market: PublicMarket | null;
  detailPath?: string;
  sharePath?: string;
  today: Date;
  selectedDate?: Date;
  onVisitDateChange?: (date: string) => void;
  onClearDate?: () => void;
  onClose: () => void;
}

const formatSourceDate = (value: string | null, locale: Locale): string => {
  if (!value) return getUiCopy(locale).sourceDateMissing;
  return locale === "en" ? value : value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
};

export function MarketDetail({ locale = "ko", mobile = false, market, detailPath, sharePath, today, selectedDate, onVisitDateChange, onClearDate, onClose }: MarketDetailProps) {
  const ui = getUiCopy(locale);
  const [monthOffset, setMonthOffset] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [pickerMonth, setPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const pickerCloseRef = useRef<HTMLButtonElement>(null);
  const dateOpenButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setMonthOffset(0), [market?.id, selectedDate?.getTime()]);
  useEffect(() => { if (datePickerOpen) pickerCloseRef.current?.focus(); }, [datePickerOpen]);
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
  const nextVisitDate = selectedDate && market.schedule.kind === "digit-pair" && !visitIsMarketDay ? getNextMarketDate(market, selectedDate) : null;
  const visitDateState = !selectedDate || market.schedule.kind === "unknown" ? "" : visitIsMarketDay ? "is-market-day" : "is-not-market-day";
  const baseMonth = selectedDate ?? today;
  const calendarMonth = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + monthOffset, 1);
  const calendarMonthNameEn = new Intl.DateTimeFormat("en-US", { month: "long" }).format(calendarMonth);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const monthMarketDays = new Set(getMarketDates(market, { start: calendarMonth, end: monthEnd }).map((date) => date.getDate()));
  const pickerMonthEnd = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 0);
  const pickerMarketDays = new Set(getMarketDates(market, { start: pickerMonth, end: pickerMonthEnd }).map((date) => date.getDate()));
  const openDatePicker = () => {
    setDraftDate(selectedDate ?? null);
    setPickerMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1));
    setDatePickerOpen(true);
  };
  const closeDatePicker = () => {
    setDatePickerOpen(false);
    dateOpenButtonRef.current?.focus();
  };

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
            <strong>{selectedDate ? mobile && locale === "ko"
              ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(selectedDate)
              : formatKoreanDate(selectedDate, locale) : locale === "en" ? "Choose a visit date" : "아직 선택하지 않았어요"}</strong>
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
            {onVisitDateChange && mobile ? <button ref={dateOpenButtonRef} type="button" className="mobile-visit-date-button" onClick={openDatePicker}>{locale === "en" ? selectedDate ? "Change visit date" : "Choose visit date" : selectedDate ? "방문 날짜 바꾸기" : "방문 날짜 선택"}</button> : null}
            {onVisitDateChange && nextVisitDate ? <div className="visit-date-recovery"><button type="button" className="secondary-button" onClick={() => onVisitDateChange(toIsoDate(nextVisitDate))}>{locale === "en" ? "Use next market day" : "다음 장날로 바꾸기"}</button>{onClearDate ? <button type="button" className="secondary-button" onClick={onClearDate}>{locale === "en" ? "Clear date filter" : "날짜 제한 해제"}</button> : null}</div> : null}
            {onVisitDateChange && !mobile ? <label className="detail-visit-date-control">
              {locale === "en" ? "Choose visit date" : "방문 날짜 선택"}
              <input type="date" aria-label={locale === "en" ? "Choose visit date" : "방문 날짜 선택"} min={toIsoDate(today)} value={selectedDate ? toIsoDate(selectedDate) : ""} onChange={(event) => onVisitDateChange(event.target.value)} />
            </label> : null}
          </div>
        </section>

      <section className="next-date-card" aria-labelledby="next-market-date">
        <div>
          <p id="next-market-date">{market.schedule.kind === "digit-pair" ? locale === "en" ? "Next market day from today" : "오늘 기준 다음 장날" : timingTitle}</p>
          <strong>{mobile && locale === "ko" && nextDate && market.schedule.kind === "digit-pair"
            ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(nextDate)
            : timingText}</strong>
        </div>
        {mobile && market.schedule.kind === "digit-pair" ? <span className="mobile-timing-pattern">{formatSchedulePattern(market, locale)}</span> : timingBadge ? <span className="dday">{timingBadge}</span> : null}
      </section>
      {market.schedule.kind === "digit-pair" ? <p className="next-date-reference">{locale === "en" ? `From today (${formatKoreanDate(today, locale)}). This is separate from your selected visit date.` : `오늘 ${formatKoreanDate(today)} 기준이에요. 선택한 방문 날짜와는 다른 기준이에요.`}{nextDate && onVisitDateChange ? <button type="button" className="mobile-visit-date-button" onClick={() => onVisitDateChange(toIsoDate(nextDate))}>{locale === "en" ? "Use this market day" : "이 장날을 방문 날짜로"}</button> : null}</p> : null}

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
          {!mobile || !hasCoordinates ? <MarketShareButton locale={locale} market={market} sharePath={sharePath} today={today} selectedDate={selectedDate} className="market-action-secondary" /> : null}
        </div>
        {mobile && hasCoordinates ? <div className="mobile-share-action"><MarketShareButton locale={locale} market={market} sharePath={sharePath} today={today} selectedDate={selectedDate} className="market-action-secondary" /></div> : null}
      </section>

      <div className="detail-section">
        <OnnuriSummary locale={locale} marketName={market.name} summary={market.onnuri} headingLevel={3} />
      </div>

      <footer className="source-note">
        <a className="report-link" href={`/report?kind=market&market=${encodeURIComponent(market.id)}`}>
          {ui.reportCorrection}
        </a>
      </footer>
      {mobile && datePickerOpen && onVisitDateChange ? (
        <div className="mobile-date-picker-overlay" onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeDatePicker(); }
          if (event.key !== "Tab") return;
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          event.stopPropagation();
        }}>
          <section className="mobile-date-picker-dialog" role="dialog" aria-modal="true" aria-label={locale === "en" ? "Choose visit date" : "방문 날짜 선택"}>
            <div className="mobile-date-picker-grip" aria-hidden="true" />
            <div className="mobile-date-picker-heading"><h2>{locale === "en" ? "Choose visit date" : "방문 날짜 선택"}</h2><button ref={pickerCloseRef} type="button" aria-label={ui.close} onClick={closeDatePicker}>×</button></div>
            <p>{locale === "en" ? "Choose a date to check market-day status." : "날짜를 고르면 그날 여는 시장과 열지 않는 시장을 나누어 보여드려요."}</p>
            <div className="mobile-date-picker-month"><strong>{pickerMonth.getFullYear()}년 {pickerMonth.getMonth() + 1}월</strong><span><button type="button" aria-label={locale === "en" ? "Previous month" : "이전 달"} onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))}>‹</button><button type="button" aria-label={locale === "en" ? "Next month" : "다음 달"} onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))}>›</button></span></div>
            <div className="mobile-date-picker-grid">
              {(locale === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["일", "월", "화", "수", "목", "금", "토"]).map((day) => <span className="mobile-date-picker-weekday" key={day}>{day}</span>)}
              {Array.from({ length: pickerMonth.getDay() }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
              {Array.from({ length: pickerMonthEnd.getDate() }, (_, index) => {
                const day = index + 1;
                const value = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), day);
                const selected = draftDate?.getTime() === value.getTime();
                return <button key={day} type="button" className={`${pickerMarketDays.has(day) ? "is-market-day" : ""} ${selected ? "is-selected" : ""}`.trim()} aria-label={locale === "en" ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(value) : `${pickerMonth.getFullYear()}년 ${pickerMonth.getMonth() + 1}월 ${day}일`} aria-pressed={selected} disabled={value < today} onClick={() => setDraftDate(value)}>{day}</button>;
              })}
            </div>
            <div className="mobile-date-picker-actions"><button type="button" onClick={closeDatePicker}>{locale === "en" ? "Cancel" : "취소"}</button><button type="button" disabled={!draftDate} onClick={() => { if (!draftDate) return; onVisitDateChange(toIsoDate(draftDate)); closeDatePicker(); }}>{locale === "en" ? "Apply date" : "이 날짜 적용"}</button></div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
