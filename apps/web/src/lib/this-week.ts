// /this-week 화면 데이터. 이번 주(목~수) 장날은 메모리의 시장 스냅샷으로, 전단은 DB에서 읽는다.
import type { BrandFlyers } from "../db/flyers";
import { getMarketsOpenOn, getPatternForDate, type DayPattern } from "./jangnal-dates";
import { addDays, flyerWeekOf, koreaToday, parseIsoDate } from "./flyers";
import type { PublicMarket } from "./market";

export interface WeekDay { date: string; pattern: DayPattern; count: number; isToday: boolean }

export function getWeekDays(markets: Pick<PublicMarket, "schedule">[], today: string): WeekDay[] {
  const { start } = flyerWeekOf(today);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    const day = parseIsoDate(date)!;
    return { date, pattern: getPatternForDate(day), count: getMarketsOpenOn(markets, day).length, isToday: date === today };
  });
}

/** DB가 없거나 읽지 못하면 전단 없이 그린다 (장날 목록과 공식 링크는 보인다). */
export async function loadBrandFlyers(now: Date): Promise<BrandFlyers[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const [{ sharedDb }, { listBrandFlyers }] = await Promise.all([import("../db/client"), import("../db/flyers")]);
    return await listBrandFlyers(sharedDb(), koreaToday(now));
  } catch (error) {
    console.error("Flyers unavailable", error);
    return [];
  }
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "10/29 목" */
export function formatWeekDay(value: string): string {
  const date = parseIsoDate(value)!;
  return `${date.getMonth() + 1}/${date.getDate()} ${WEEKDAYS[date.getDay()]}`;
}
