import type { PublicMarket } from "./market";
import { getMarketDates, getNextMarketDate } from "./schedule";

export type DayPattern = "1-6" | "2-7" | "3-8" | "4-9" | "5-10";

export const DAY_PATTERNS: readonly DayPattern[] = ["1-6", "2-7", "3-8", "4-9", "5-10"];

type ScheduledMarket = Pick<PublicMarket, "schedule">;

export function getPatternOf(market: ScheduledMarket): DayPattern | null {
  if (market.schedule.kind !== "digit-pair") return null;
  const low = Math.min(...market.schedule.days.map((day) => (day === 0 ? 10 : day)));
  return DAY_PATTERNS.find((pattern) => pattern.startsWith(`${low}-`)) ?? null;
}

export function getPatternForDate(date: Date): DayPattern {
  const digit = date.getDate() % 10;
  const low = digit === 0 ? 5 : digit > 5 ? digit - 5 : digit;
  return DAY_PATTERNS[low - 1];
}

export function formatPatternLabel(pattern: DayPattern): string {
  return `${pattern.replace("-", "·")}일장`;
}

export function getPatternDays(pattern: DayPattern): [number, number] {
  const low = Number(pattern.split("-")[0]);
  return [low, (low + 5) % 10];
}

export function findDayPattern(value: string): DayPattern | undefined {
  return DAY_PATTERNS.find((pattern) => pattern === value);
}

export function getMarketsOpenOn<T extends ScheduledMarket>(markets: T[], date: Date): T[] {
  return markets.filter((market) => getMarketDates(market, { start: date, end: date }).length > 0);
}

export function getMonthCalendar<T extends ScheduledMarket>(
  markets: T[],
  year: number,
  monthIndex: number,
): { date: Date; pattern: DayPattern; count: number }[] {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1);
    return { date, pattern: getPatternForDate(date), count: getMarketsOpenOn(markets, date).length };
  });
}

export function getNextOpenDate(markets: ScheduledMarket[], from: Date): Date | null {
  return markets
    .map((market) => getNextMarketDate(market, from))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

export interface MarketLink {
  id: string;
  name: string;
  district: string;
  marketType: string;
  schedule: PublicMarket["schedule"];
  hasParking: boolean | null;
  href: string;
  reviewed: boolean;
}
