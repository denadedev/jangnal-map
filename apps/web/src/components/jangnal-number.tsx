import type { PublicMarket } from "../lib/market";
import { getDday } from "../lib/market-view";
import { getNextMarketDate } from "../lib/schedule";

export type JangnalTone = "today" | "soon" | "idle";

export function formatPatternDigits(market: Pick<PublicMarket, "schedule">): string | null {
  if (market.schedule.kind !== "digit-pair") return null;
  const [first, second] = market.schedule.days;
  return `${first}·${second === 0 ? 10 : second}`;
}

export function getJangnalTone(market: PublicMarket, referenceDate: Date): JangnalTone {
  if (market.schedule.kind !== "digit-pair") return "idle";
  const next = getNextMarketDate(market, referenceDate);
  if (!next) return "idle";
  const days = getDday(next, referenceDate);
  return days === 0 ? "today" : days <= 2 ? "soon" : "idle";
}

interface JangnalTileProps {
  market: PublicMarket;
  referenceDate: Date;
  todayLabel: string;
  marketDayLabel: string;
  dailyLabel: string;
  unknownLabel: string;
}

export function JangnalTile({ market, referenceDate, todayLabel, marketDayLabel, dailyLabel, unknownLabel }: JangnalTileProps) {
  const digits = formatPatternDigits(market);
  const tone = getJangnalTone(market, referenceDate);
  return (
    <span className={`jn-tile is-${tone}`} aria-hidden="true">
      {digits ? <b className="jn">{digits}</b> : <b className="jn-text">{market.schedule.kind === "daily" ? dailyLabel : unknownLabel}</b>}
      <small>{tone === "today" ? todayLabel : marketDayLabel}</small>
    </span>
  );
}
