import type { PublicMarket } from "../lib/market";
import { getMarketBrowsePath } from "../lib/market-path";
import { formatDistance, formatMarketTiming, formatSchedulePattern, getDistanceKm, type Coordinates } from "../lib/market-view";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

interface MarketListProps {
  locale?: Locale;
  getMarketHref?: (market: PublicMarket) => string;
  markets: PublicMarket[];
  reviewedMarketIds?: ReadonlySet<string>;
  referenceDate: Date;
  selectedId: string | null;
  onSelect: (market: PublicMarket) => void;
  onReset: () => void;
  currentLocation: Coordinates | null;
}

export function MarketList({ locale = "ko", getMarketHref, markets, reviewedMarketIds = new Set(), referenceDate, selectedId, onSelect, onReset, currentLocation }: MarketListProps) {
  const ui = getUiCopy(locale);
  if (markets.length === 0) {
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

  return (
    <ul className="market-list" aria-label={ui.resultsLabel}>
      {markets.map((market) => {
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
}
