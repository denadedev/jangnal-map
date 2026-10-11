import type { MarketSchedule } from "./market";

export interface DateRange {
  start: Date;
  end: Date;
}

type ScheduledMarket = {
  schedule: MarketSchedule;
};

const atStartOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

type DigitPairSchedule = Extract<MarketSchedule, { kind: "digit-pair" }>;

const followsThirtyFirst = (date: Date): boolean =>
  date.getDate() === 1 && new Date(date.getFullYear(), date.getMonth(), 0).getDate() === 31;

// 일부 1·6일장은 31일에 장을 열고 다음 날 1일은 쉰다.
const hasMarketDayEnding = (date: Date, schedule: DigitPairSchedule): boolean =>
  schedule.days.includes(date.getDate() % 10) && !(schedule.skipsFirstAfterThirtyFirst && followsThirtyFirst(date));

export function getMarketDates(market: ScheduledMarket, range: DateRange): Date[] {
  const start = atStartOfDay(range.start);
  const end = atStartOfDay(range.end);
  if (start > end) return [];
  if (market.schedule.kind === "unknown") return [];

  const dates: Date[] = [];
  for (const date = start; date <= end; date.setDate(date.getDate() + 1)) {
    if (market.schedule.kind === "daily" || hasMarketDayEnding(date, market.schedule)) {
      dates.push(new Date(date));
    }
  }

  return dates;
}

export function getNextMarketDate(market: ScheduledMarket, from: Date): Date | null {
  if (market.schedule.kind === "unknown") return null;
  const date = atStartOfDay(from);
  if (market.schedule.kind === "daily") return date;
  while (!hasMarketDayEnding(date, market.schedule)) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}
