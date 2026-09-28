import type { PublicMarket } from "../lib/market";
import type { Locale } from "../lib/locale";
import { getDday, formatKoreanDate, formatMarketType, formatSchedulePattern } from "../lib/market-view";
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
  onClose: () => void;
}

const formatSourceDate = (value: string | null, locale: Locale): string => {
  if (!value) return getUiCopy(locale).sourceDateMissing;
  return locale === "en" ? value : value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
};

const datesThrough = (start: Date, end: Date): Date[] => {
  const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const dates: Date[] = [];
  while (date <= last) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export function MarketDetail({ locale = "ko", market, detailPath, sharePath, today, selectedDate, onClose }: MarketDetailProps) {
  const ui = getUiCopy(locale);
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
  const timelineEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6);
  const timelineDates = market.schedule.kind === "digit-pair" ? datesThrough(today, timelineEnd) : [];
  const marketDayTimes = new Set(getMarketDates(market, { start: today, end: timelineEnd }).map((date) => date.getTime()));
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

      {locale === "en" && selectedDate ? (
        <section className="next-date-card selected-date-card" aria-label="Your selected travel date">
          <div>
            <p>{market.schedule.kind === "digit-pair" ? "Market day on your selected date" : "Regular schedule on your selected date"}</p>
            <strong>{formatKoreanDate(selectedDate, "en")}</strong>
          </div>
        </section>
      ) : null}

      <section className="next-date-card" aria-labelledby="next-market-date">
        <div>
          <p id="next-market-date">{timingTitle}</p>
          <strong>{timingText}</strong>
        </div>
        {timingBadge ? <span className="dday">{timingBadge}</span> : null}
      </section>

      {market.schedule.kind === "digit-pair" ? (
        <section className="detail-section" aria-labelledby="upcoming-dates">
          <div className="section-heading">
            <h3 id="upcoming-dates">{ui.nextSevenDays}</h3>
            <span>{locale === "en" ? formatSchedulePattern(market, locale) : market.scheduleRaw}</span>
          </div>
          <ol className="date-timeline" aria-label={locale === "en" ? "Market days in the next 7 days" : "오늘부터 7일간 장날"}>
            {timelineDates.map((date, index) => {
              const isMarketDay = marketDayTimes.has(date.getTime());
              const isToday = index === 0;
              return (
                <li key={date.toISOString()} className={`${isToday ? "is-today" : ""} ${isMarketDay ? "is-market-day" : ""}`.trim()}>
                  <strong>{date.getDate()}</strong>
                  <small>{new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", { weekday: "short" }).format(date)}</small>
                  <em>{isToday && isMarketDay ? ui.marketDayToday : isMarketDay ? ui.marketDay : isToday ? locale === "en" ? "Today" : ui.today : ""}</em>
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
        <span>{ui.source}</span>
        <a href={market.source.url} target="_blank" rel="noreferrer" lang="ko">{market.source.name}</a>
        <p>{ui.sourceDate} {formatSourceDate(market.referenceDate ?? market.source.referenceDate, locale)}</p>
        <a className="report-link" href={`/report?kind=market&market=${encodeURIComponent(market.id)}`}>
          {ui.reportCorrection}
        </a>
      </footer>
    </article>
  );
}
