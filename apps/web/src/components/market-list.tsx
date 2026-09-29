import type { PublicMarket } from "../lib/market";
import type { DateRange } from "../lib/schedule";
import { getMarketBrowsePath } from "../lib/market-path";
import { formatDistance, formatMarketTiming, formatSchedulePattern, getDistanceKm, type Coordinates } from "../lib/market-view";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

interface MarketListProps {
  locale?: Locale;
  getMarketHref?: (market: PublicMarket) => string;
  markets: PublicMarket[];
  inactiveMarkets?: PublicMarket[];
  range?: DateRange | null;
  onClearDate?: () => void;
  reviewedMarketIds?: ReadonlySet<string>;
  referenceDate: Date;
  selectedId: string | null;
  onSelect: (market: PublicMarket) => void;
  onReset: () => void;
  currentLocation: Coordinates | null;
}

export function MarketList({ locale = "ko", getMarketHref, markets, inactiveMarkets = [], range, onClearDate, reviewedMarketIds = new Set(), referenceDate, selectedId, onSelect, onReset, currentLocation }: MarketListProps) {
  const ui = getUiCopy(locale);
  if (markets.length === 0 && inactiveMarkets.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true" />
        <h2>{ui.noResults}</h2>
        <p>{ui.noResultsHelp}</p>
        <button type="button" className="secondary-button" onClick={onReset}>
          {ui.resetFilters}
        </button>
      </div>
    );
  }

  const renderItems = (items: PublicMarket[], inactive: boolean) => (
    <ul className="market-list" aria-label={inactive ? locale === "en" ? "Markets outside the selected dates" : "선택 기간 밖의 검색된 시장" : ui.resultsLabel}>
      {items.map((market) => {
        const distance = currentLocation && market.latitude !== null && market.longitude !== null
          ? getDistanceKm(currentLocation, { latitude: market.latitude, longitude: market.longitude })
          : null;
        return (
        <li key={market.id}>
          <a
            href={getMarketHref?.(market) ?? getMarketBrowsePath(market, reviewedMarketIds.has(market.id))}
            data-market-id={market.id}
            className="market-list-item"
            aria-current={market.id === selectedId ? "true" : undefined}
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onSelect(market);
            }}
          >
            <span className="list-date" aria-label={`${ui.scheduleLabel} ${formatMarketTiming(market, referenceDate, locale)}`}>
              <strong>{formatMarketTiming(market, referenceDate, locale)}</strong>
              <small>{market.schedule.kind === "daily" ? ui.operates : ui.marketDay}</small>
            </span>
            <span className="list-copy">
              <strong lang={locale === "en" ? "ko" : undefined}>{market.name}</strong>
              {locale === "en" && market.schedule.kind === "daily" ? null : <span className={`schedule-tag is-${market.schedule.kind}`}>{formatSchedulePattern(market, locale)}</span>}
              <span lang={market.roadAddress || market.lotAddress ? "ko" : undefined}>{market.roadAddress ?? market.lotAddress ?? ui.addressMissing}</span>
              {distance !== null ? <span className="distance-label">{locale === "en" ? "From your location" : "현재 위치에서"} <b>{formatDistance(distance)}</b></span> : null}
              {market.latitude === null || market.longitude === null ? <em>{ui.locationMissing}</em> : null}
              {!inactive && market.schedule.kind === "daily" ? <em className="market-date-status">{locale === "en" ? "Regular daily schedule" : "매일 운영 일정"}</em> : null}
              {inactive ? <em className="market-date-status">{market.schedule.kind === "unknown"
                ? ui.scheduleUnconfirmed
                : range && range.start.getTime() === range.end.getTime()
                  ? locale === "en" ? "No market day on this date" : "이날은 5일장이 아니에요"
                  : locale === "en" ? "No market day in this period" : "선택한 기간에 장날이 없어요"}</em> : null}
            </span>
            <svg className="chevron" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </a>
        </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {markets.length > 0 ? renderItems(markets, false) : inactiveMarkets.length > 0 ? (
        <div className="empty-state market-date-empty">
          <h2>{locale === "en" ? "No market days match this date" : "이날 장이 서는 검색 결과가 없어요"}</h2>
          <p>{locale === "en" ? "Matching markets are listed below." : "검색한 시장은 아래에서 계속 볼 수 있어요."}</p>
          {onClearDate ? <button type="button" className="secondary-button" onClick={onClearDate}>{locale === "en" ? "Clear date filter" : "날짜 제한 해제"}</button> : null}
        </div>
      ) : null}
      {inactiveMarkets.length > 0 ? (
        <section className="inactive-market-results" aria-label={locale === "en" ? "Other matching markets" : "다른 검색 결과"}>
          <h2>{locale === "en" ? "Search matches outside the date filter" : "날짜 조건에서 제외된 검색 결과"}</h2>
          {renderItems(inactiveMarkets, true)}
        </section>
      ) : null}
    </>
  );
}
