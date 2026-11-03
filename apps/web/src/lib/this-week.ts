// 마트 전단 탭(/this-week) 화면 데이터. 전단은 DB에서 읽는다.
import type { BrandFlyers } from "../db/flyers";
import { addDays, koreaToday, parseIsoDate } from "./flyers";

/** DB가 없거나 읽지 못하면 빈 목록을 돌려준다. 화면은 안내 문구만 보인다. */
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

/** 지금 걸린 전단 묶음을 가리키는 값. 전단이 없으면 null. 하단 탭이 본 적 있는 값과 비교해 새 전단 점을 띄운다. */
export const currentFlyersKey = (brands: BrandFlyers[]): string | null =>
  brands.flatMap((brand) => brand.flyer ? [brand.flyer.id] : []).sort().join(",") || null;

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "10/29 목" */
export function formatWeekDay(value: string): string {
  const date = parseIsoDate(value)!;
  return `${date.getMonth() + 1}/${date.getDate()} ${WEEKDAYS[date.getDay()]}`;
}

/** 전단 주간이 끝나는 날과 그 전날에만 붙이는 말. 그 밖에는 null. */
export function flyerEndingLabel(today: string, endsOn: string): "오늘 끝나요" | "내일 끝나요" | null {
  if (today === endsOn) return "오늘 끝나요";
  if (addDays(today, 1) === endsOn) return "내일 끝나요";
  return null;
}
