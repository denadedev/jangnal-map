import type { PublicMarket } from "./market";
import { getMarketDates, getNextMarketDate, type DateRange } from "./schedule";

import type { DateFilterMode } from "../components/market-filters";

const atStartOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

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

export function getDateRange(mode: DateFilterMode, today: Date, directDate: string): DateRange {
  const day = atStartOfDay(today);
  if (mode === "today") return { start: day, end: day };
  if (mode === "date") {
    const selected = normalizeDirectDate(directDate, day);
    return { start: selected, end: selected };
  }

  const mondayOffset = (day.getDay() + 6) % 7;
  const monday = new Date(day);
  monday.setDate(day.getDate() - mondayOffset);

  if (mode === "weekend") {
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: day > saturday ? day : saturday, end: sunday };
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: day, end: sunday };
}

export function filterMarkets(
  markets: PublicMarket[],
  query: string,
  range: DateRange,
): PublicMarket[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  return markets.filter((market) => {
    const searchable = [market.name, market.roadAddress, market.lotAddress].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
    return (!normalizedQuery || searchable.includes(normalizedQuery)) && getMarketDates(market, range).length > 0;
  });
}

export function formatMarketTiming(market: PublicMarket, referenceDate: Date): string {
  if (market.schedule.kind === "daily") return "매일";
  if (market.schedule.kind === "unknown") return "일정 확인";
  const date = getNextMarketDate(market, referenceDate);
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : "일정 확인";
}

export function formatKoreanDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long" }).format(date);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}`;
}

export function getDday(date: Date, from: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((atStartOfDay(date).getTime() - atStartOfDay(from).getTime()) / millisecondsPerDay);
}
