// 대형마트 주간 전단. 날짜는 한국 날짜를 "YYYY-MM-DD" 문자열로 다룬다 (DB date 컬럼과 같은 모양).
import { MART_BRAND_LABELS, type MartBrandCode } from "../db/codes";
import { getKoreaCalendarDate } from "./korea-date";
import { toIsoDate } from "./market-view";

export const MAX_FLYER_PAGES = 10;
/** 종료일 다음 날부터 이만큼 지나면 전단을 지운다. */
export const FLYER_RETENTION_DAYS = 30;
/** 시작일과 종료일 차이의 최대치. DB check와 같다. */
export const MAX_FLYER_PERIOD_DAYS = 31;

const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string): Date | null {
  const match = isoPattern.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toIsoDate(date) === value ? date : null;
}

export const addDays = (value: string, days: number): string => {
  const date = parseIsoDate(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
};

export const koreaToday = (now: Date): string => toIsoDate(getKoreaCalendarDate(now));

const daysBetween = (from: string, to: string) => Math.round((parseIsoDate(to)!.getTime() - parseIsoDate(from)!.getTime()) / 86_400_000);

/** 마트 전단 주간(목~수) 가운데 오늘이 든 주. */
export function flyerWeekOf(today: string): { start: string; end: string } {
  const date = parseIsoDate(today);
  if (!date) throw new Error(`Invalid date: ${today}`);
  const sinceThursday = (date.getDay() + 3) % 7;
  const start = addDays(today, -sinceThursday);
  return { start, end: addDays(start, 6) };
}

/** 오늘 보여 줄 전단인지. 종료일 당일까지 보이고 다음 날 숨는다. */
export const isFlyerCurrent = (flyer: { startsOn: string; endsOn: string }, today: string): boolean =>
  flyer.startsOn <= today && today <= flyer.endsOn;

/** 이 날짜보다 종료일이 이르면 지운다. */
export const flyerDeleteBefore = (today: string): string => addDays(today, -FLYER_RETENTION_DAYS);

export const isMartBrand = (value: unknown): value is MartBrandCode =>
  typeof value === "string" && Object.hasOwn(MART_BRAND_LABELS, value);

/** "10/29~11/4" */
export function formatFlyerPeriod(startsOn: string, endsOn: string): string {
  const short = (value: string) => {
    const date = parseIsoDate(value)!;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  return `${short(startsOn)}~${short(endsOn)}`;
}

export interface FlyerUploadInput {
  brand: MartBrandCode;
  startsOn: string;
  endsOn: string;
  baseStoreName: string | null;
}

export type FlyerUploadErrors = Partial<Record<"brand" | "starts_on" | "ends_on" | "base_store" | "images", string>>;

/** 슬랙 입력 창 값 검사. 오류는 입력 칸(block_id)별로 돌려준다. */
export function validateFlyerUpload(values: { brand?: string; startsOn?: string; endsOn?: string; baseStoreName?: string; imageCount: number }):
  { ok: true; input: FlyerUploadInput } | { ok: false; errors: FlyerUploadErrors } {
  const errors: FlyerUploadErrors = {};
  if (!isMartBrand(values.brand)) errors.brand = "브랜드를 골라 주세요.";
  const startsOn = values.startsOn ?? "";
  const endsOn = values.endsOn ?? "";
  if (!parseIsoDate(startsOn)) errors.starts_on = "시작일을 골라 주세요.";
  if (!parseIsoDate(endsOn)) errors.ends_on = "종료일을 골라 주세요.";
  else if (parseIsoDate(startsOn) && endsOn < startsOn) errors.ends_on = "종료일은 시작일과 같거나 뒤여야 해요.";
  else if (parseIsoDate(startsOn) && daysBetween(startsOn, endsOn) > MAX_FLYER_PERIOD_DAYS) errors.ends_on = `행사 기간은 ${MAX_FLYER_PERIOD_DAYS}일을 넘을 수 없어요.`;
  const baseStoreName = values.baseStoreName?.trim() || null;
  if (baseStoreName && baseStoreName.length > 30) errors.base_store = "기준 매장은 30자 안으로 적어 주세요.";
  if (values.imageCount < 1) errors.images = "전단 이미지를 1장 이상 올려 주세요.";
  else if (values.imageCount > MAX_FLYER_PAGES) errors.images = `이미지는 ${MAX_FLYER_PAGES}장까지 올릴 수 있어요.`;
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { brand: values.brand as MartBrandCode, startsOn, endsOn, baseStoreName } };
}

export const flyerPagePath = (pageId: string) => `/api/flyers/pages/${pageId}`;
export const flyerViewerPath = (brand: MartBrandCode) => `/this-week/flyer/${brand}`;
