import type { PublicMarket } from "./market";
import { getMarketDates, getNextMarketDate, type DateRange } from "./schedule";

import type { DateFilterMode } from "../components/market-filters";

const atStartOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const toRadians = (degrees: number): number => degrees * Math.PI / 180;

export function getDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6_371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function sortMarketsByDistance(markets: PublicMarket[], origin: Coordinates): PublicMarket[] {
  return markets.map((market, index) => ({
    market,
    index,
    distance: market.latitude === null || market.longitude === null
      ? Number.POSITIVE_INFINITY
      : getDistanceKm(origin, { latitude: market.latitude, longitude: market.longitude }),
  })).sort((left, right) => left.distance - right.distance || left.index - right.index).map(({ market }) => market);
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1_000)}m`;
  return `${distanceKm.toFixed(1)}km`;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string, fallback: Date): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return atStartOfDay(fallback);
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    Number.isNaN(parsed.getTime())
    || parsed.getFullYear() !== Number(year)
    || parsed.getMonth() !== Number(month) - 1
    || parsed.getDate() !== Number(day)
  ) {
    return atStartOfDay(fallback);
  }
  return parsed;
}

export function normalizeDirectDate(value: string, today: Date): Date {
  const minimum = atStartOfDay(today);
  const parsed = fromIsoDate(value, minimum);
  return parsed < minimum ? minimum : parsed;
}

export function getDateRange(mode: DateFilterMode, today: Date, directDate: string): DateRange | null {
  const day = atStartOfDay(today);
  if (mode === "all") return null;
  if (mode === "today") return { start: day, end: day };
  if (mode === "date") {
    const selected = normalizeDirectDate(directDate, day);
    return { start: selected, end: selected };
  }

  if (mode === "weekend") {
    const daysUntilSaturday = day.getDay() === 0 ? 6 : (6 - day.getDay() + 7) % 7;
    const saturday = new Date(day);
    saturday.setDate(day.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    return { start: saturday, end: sunday };
  }

  const end = new Date(day);
  end.setDate(day.getDate() + 6);
  return { start: day, end };
}

export function filterMarkets(
  markets: PublicMarket[],
  query: string,
  range: DateRange | null,
  options: { includeDaily?: boolean } = {},
): PublicMarket[] {
  const includeDaily = options.includeDaily ?? true;
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  return markets.filter((market) => {
    const searchable = [market.name, market.roadAddress, market.lotAddress].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (range === null || (market.schedule.kind !== "daily" || includeDaily) && getMarketDates(market, range).length > 0);
  });
}

export function formatMarketTiming(market: PublicMarket, referenceDate: Date): string {
  if (market.schedule.kind === "daily") return "매일";
  if (market.schedule.kind === "unknown") return "일정 확인";
  const date = getNextMarketDate(market, referenceDate);
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : "일정 확인";
}

export function formatSchedulePattern(market: PublicMarket): string {
  if (market.schedule.kind === "daily") return "매일";
  if (market.schedule.kind === "unknown") return "일정 확인";
  const [first, second] = market.schedule.days;
  return `${first}·${second === 0 ? 10 : second}일장`;
}

export function formatKoreanDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(date);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}`;
}

export function getDday(date: Date, from: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((atStartOfDay(date).getTime() - atStartOfDay(from).getTime()) / millisecondsPerDay);
}
