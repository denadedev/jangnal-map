import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";
import { findRegionEditorial } from "./region-editorial";
import { getMarketDistrict, getMarketRegion, REGIONS, type Region, type RegionSlug } from "./region";
import { getMarketDates, getNextMarketDate } from "./schedule";

export type DayPattern = "1-6" | "2-7" | "3-8" | "4-9" | "5-10";

export const DAY_PATTERNS: readonly DayPattern[] = ["1-6", "2-7", "3-8", "4-9", "5-10"];

export const LAUNCH_MIN_MARKETS = 20;

type ScheduledMarket = Pick<PublicMarket, "schedule">;

export const periodicMarkets = publicMarkets.filter(
  (market) => market.status === "운영" && market.schedule.kind === "digit-pair",
);

const koreanOrder = (a: string, b: string): number => a.localeCompare(b, "ko-KR");

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

export function findDayPattern(value: string): DayPattern | undefined {
  return DAY_PATTERNS.find((pattern) => pattern === value);
}

export function getRegionMarkets(slug: RegionSlug): PublicMarket[] {
  return periodicMarkets.filter((market) => getMarketRegion(market)?.slug === slug);
}

export function getPatternMarkets(pattern: DayPattern): PublicMarket[] {
  return periodicMarkets.filter((market) => getPatternOf(market) === pattern);
}

const sortByName = (markets: PublicMarket[]): PublicMarket[] =>
  [...markets].sort((a, b) => koreanOrder(a.name, b.name));

export function groupByDistrict(markets: PublicMarket[]): { district: string; markets: PublicMarket[] }[] {
  const groups = new Map<string, PublicMarket[]>();
  for (const market of markets) {
    const district = getMarketDistrict(market);
    groups.set(district, [...(groups.get(district) ?? []), market]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => koreanOrder(a, b))
    .map(([district, items]) => ({ district, markets: sortByName(items) }));
}

export function groupByRegion(markets: PublicMarket[]): { region: Region; markets: PublicMarket[] }[] {
  return REGIONS
    .map((region) => ({ region, markets: sortByName(markets.filter((market) => getMarketRegion(market)?.slug === region.slug)) }))
    .filter(({ markets: items }) => items.length > 0);
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

export function isLaunchRegion(slug: RegionSlug): boolean {
  return getRegionMarkets(slug).length >= LAUNCH_MIN_MARKETS && findRegionEditorial(slug) !== undefined;
}

export const launchRegions = (): Region[] => REGIONS.filter((region) => isLaunchRegion(region.slug));
