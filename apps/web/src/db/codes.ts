// DB에는 코드값만 저장하고, 허용 값과 화면 이름은 여기서 관리한다.

export const MARKET_TYPE_LABELS = {
  permanent: "상설장",
  "periodic-3": "3일장",
  "periodic-4": "4일장",
  "periodic-5": "5일장",
  "permanent-periodic-3": "상설장+3일장",
  "permanent-periodic-4": "상설장+4일장",
  "permanent-periodic-5": "상설장+5일장",
} as const;
export type MarketTypeCode = keyof typeof MARKET_TYPE_LABELS;

export const MARKET_STATUS_LABELS = { open: "운영", closed: "폐장" } as const;
export type MarketStatusCode = keyof typeof MARKET_STATUS_LABELS;

export const SCHEDULE_KINDS = ["daily", "digit-pair", "unknown"] as const;
export type ScheduleKindCode = (typeof SCHEDULE_KINDS)[number];

export const SPECIALTY_ORIGINS = ["editorial", "user"] as const;
export type SpecialtyOriginCode = (typeof SPECIALTY_ORIGINS)[number];

export const GUIDE_STATUSES = ["draft", "reviewed"] as const;
export type GuideStatusCode = (typeof GUIDE_STATUSES)[number];

function codeForLabel<T extends string>(labels: Record<T, string>, label: string): T | undefined {
  return (Object.keys(labels) as T[]).find((code) => labels[code] === label);
}

export const marketTypeCode = (label: string) => codeForLabel(MARKET_TYPE_LABELS, label);
export const marketStatusCode = (label: string) => codeForLabel(MARKET_STATUS_LABELS, label);
