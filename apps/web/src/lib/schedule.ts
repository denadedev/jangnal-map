import type { MarketSchedule } from "./market";

export interface DateRange {
  start: Date;
  end: Date;
}

type ScheduledMarket = {
  schedule: MarketSchedule;
};

const atStartOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const hasMarketDayEnding = (date: Date, days: [number, number]): boolean => days.includes(date.getDate() % 10);

export function getMarketDates(market: ScheduledMarket, range: DateRange): Date[] {
  const start = atStartOfDay(range.start);
  const end = atStartOfDay(range.end);
  if (start > end) return [];
  if (market.schedule.kind === "unknown") return [];

  const dates: Date[] = [];
  for (const date = start; date <= end; date.setDate(date.getDate() + 1)) {
    if (market.schedule.kind === "daily" || hasMarketDayEnding(date, market.schedule.days)) {
      dates.push(new Date(date));
    }
  }

  return dates;
}

export function getNextMarketDate(market: ScheduledMarket, from: Date): Date | null {
  if (market.schedule.kind === "unknown") return null;
  const date = atStartOfDay(from);
  if (market.schedule.kind === "daily") return date;
  while (!hasMarketDayEnding(date, market.schedule.days)) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}
