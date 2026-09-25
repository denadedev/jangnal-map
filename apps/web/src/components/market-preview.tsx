import type { PublicMarket } from "../lib/market";
import { formatKoreanDate, getDday } from "../lib/market-view";
import { getNextMarketDate } from "../lib/schedule";

interface MarketPreviewProps {
  market: PublicMarket;
  today: Date;
  onOpenDetail: () => void;
}

export function MarketPreview({ market, today, onOpenDetail }: MarketPreviewProps) {
  const nextDate = getNextMarketDate(market, today);
  const dday = nextDate ? getDday(nextDate, today) : null;
  const scheduleText = market.schedule.kind === "daily"
    ? "매일 운영"
    : market.schedule.kind === "unknown"
      ? "운영 일정 확인 필요"
      : nextDate
        ? formatKoreanDate(nextDate)
        : "운영 일정 확인 필요";
  const ddayText = market.schedule.kind !== "digit-pair" || dday === null
    ? ""
    : dday === 0 ? " · 오늘 장날" : ` · D-${dday}`;
  const address = market.roadAddress ?? market.lotAddress ?? "주소 정보 없음";

  return (
    <article className="market-preview" aria-label={`${market.name} 미리보기`}>
      <p className="sr-only">{market.marketType}</p>
      <div className="market-preview-date">
        <strong>{market.schedule.kind === "digit-pair" ? "다음 장날" : "운영 일정"}</strong>
        <span>{scheduleText}{ddayText}</span>
      </div>
      <p className="market-preview-address" title={address}>{address}</p>
      <button type="button" className="market-preview-detail" onClick={onOpenDetail}>상세 보기</button>
    </article>
  );
}
