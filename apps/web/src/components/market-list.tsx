import type { PublicMarket } from "../lib/market";
import { formatDistance, formatMarketTiming, formatSchedulePattern, getDistanceKm, type Coordinates } from "../lib/market-view";

interface MarketListProps {
  markets: PublicMarket[];
  referenceDate: Date;
  selectedId: string | null;
  onSelect: (market: PublicMarket) => void;
  onReset: () => void;
  currentLocation: Coordinates | null;
}

export function MarketList({ markets, referenceDate, selectedId, onSelect, onReset, currentLocation }: MarketListProps) {
  if (markets.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true" />
        <h2>조건에 맞는 시장이 없어요</h2>
        <p>지역 이름을 줄이거나 다른 날짜를 골라보세요.</p>
        <button type="button" className="secondary-button" onClick={onReset}>
          필터 초기화
        </button>
      </div>
    );
  }

  return (
    <ul className="market-list" aria-label="검색된 시장">
      {markets.map((market) => {
        const distance = currentLocation && market.latitude !== null && market.longitude !== null
          ? getDistanceKm(currentLocation, { latitude: market.latitude, longitude: market.longitude })
          : null;
        return (
        <li key={market.id}>
          <button
            type="button"
            className="market-list-item"
            aria-pressed={market.id === selectedId}
            onClick={() => onSelect(market)}
          >
            <span className="list-date" aria-label={`운영 일정 ${formatMarketTiming(market, referenceDate)}`}>
              <strong>{formatMarketTiming(market, referenceDate)}</strong>
              <small>{market.schedule.kind === "daily" ? "운영" : "장날"}</small>
            </span>
            <span className="list-copy">
              <strong>{market.name}</strong>
              <span className={`schedule-tag is-${market.schedule.kind}`}>{formatSchedulePattern(market)}</span>
              <span>{market.roadAddress ?? market.lotAddress ?? "주소 정보 없음"}</span>
              {distance !== null ? <span className="distance-label">현재 위치에서 <b>{formatDistance(distance)}</b></span> : null}
              {market.latitude === null || market.longitude === null ? <em>위치 확인 필요</em> : null}
            </span>
            <svg className="chevron" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </li>
        );
      })}
    </ul>
  );
}
