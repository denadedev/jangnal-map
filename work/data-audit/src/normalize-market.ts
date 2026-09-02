import type { NormalizedMarket, RawMarket } from "./types.js";

const nullableText = (value: string): string | null => value.trim() || null;

const nullableNumber = (value: string): number | null => {
  if (!value.trim()) return null;

  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
};

export function normalizeMarket(raw: RawMarket): NormalizedMarket {
  const parking = raw.주차장보유여부.trim().toUpperCase();

  return {
    name: raw.시장명.trim(),
    marketType: raw.시장유형.trim(),
    roadAddress: nullableText(raw.소재지도로명주소),
    lotAddress: nullableText(raw.소재지지번주소),
    scheduleRaw: nullableText(raw.시장개설주기),
    latitude: nullableNumber(raw.위도),
    longitude: nullableNumber(raw.경도),
    storeCount: nullableNumber(raw.점포수),
    products: raw.취급품목
      .split("+")
      .map((item) => item.trim())
      .filter(Boolean),
    hasParking: parking === "Y" ? true : parking === "N" ? false : null,
    phone: nullableText(raw.전화번호),
    homepageUrl: nullableText(raw.홈페이지주소),
    referenceDate: nullableText(raw.데이터기준일자),
    status: "운영",
    statusVerified: false,
  };
}
