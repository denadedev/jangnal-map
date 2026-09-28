import type { PublicMarket } from "../lib/market";
import { formatKoreanDate, formatMarketType, getDday } from "../lib/market-view";
import { getNextMarketDate } from "../lib/schedule";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

interface MarketPreviewProps {
  locale?: Locale;
  market: PublicMarket;
  today: Date;
  selectedDate?: Date;
  onOpenDetail: () => void;
}

export function MarketPreview({ locale = "ko", market, today, selectedDate, onOpenDetail }: MarketPreviewProps) {
  const ui = getUiCopy(locale);
  const nextDate = getNextMarketDate(market, today);
  const dday = nextDate ? getDday(nextDate, today) : null;
  const scheduleText = market.schedule.kind === "daily"
    ? ui.dailySchedule
    : market.schedule.kind === "unknown"
      ? ui.scheduleUnconfirmed
      : nextDate
        ? formatKoreanDate(nextDate, locale)
        : ui.scheduleUnconfirmed;
  const ddayText = market.schedule.kind !== "digit-pair" || dday === null
    ? ""
    : dday === 0 ? ` · ${ui.marketDayToday}` : ` · D-${dday}`;
  const address = market.roadAddress ?? market.lotAddress ?? ui.addressMissing;

  return (
    <article className="market-preview" aria-label={locale === "en" ? `${market.name} preview` : `${market.name} 미리보기`}>
      <p className="sr-only">{formatMarketType(market.marketType, locale)}</p>
      {locale === "en" && selectedDate ? (
        <p className="market-preview-selected-date">{market.schedule.kind === "digit-pair" ? "Market day on your selected date" : "Regular schedule on your selected date"}: {formatKoreanDate(selectedDate, "en")}</p>
      ) : null}
      <div className="market-preview-date">
        <strong>{market.schedule.kind === "digit-pair" ? ui.nextMarketDay : ui.scheduleLabel}</strong>
        <span>{scheduleText}{ddayText}</span>
      </div>
      <p className="market-preview-address" title={address} lang={market.roadAddress || market.lotAddress ? "ko" : undefined}>{address}</p>
      <button type="button" className="market-preview-detail" onClick={onOpenDetail}>{ui.viewDetail}</button>
    </article>
  );
}
