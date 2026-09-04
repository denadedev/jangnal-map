import type { PublicMarket } from "../lib/market";
import { formatPinDate } from "../lib/market-view";

interface MarketListProps {
  markets: PublicMarket[];
  referenceDate: Date;
  selectedId: string | null;
  onSelect: (market: PublicMarket) => void;
  onReset: () => void;
}

export function MarketList({ markets, referenceDate, selectedId, onSelect, onReset }: MarketListProps) {
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
      {markets.map((market) => (
        <li key={market.id}>
          <button
            type="button"
            className="market-list-item"
            aria-pressed={market.id === selectedId}
            onClick={() => onSelect(market)}
          >
            <span className="list-date" aria-label={`다음 장날 ${formatPinDate(market, referenceDate)}`}>
              <strong>{formatPinDate(market, referenceDate)}</strong>
              <small>장날</small>
            </span>
            <span className="list-copy">
              <strong>{market.name}</strong>
              <span>{market.roadAddress ?? market.lotAddress ?? "주소 정보 없음"}</span>
            </span>
            <svg className="chevron" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
