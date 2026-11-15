import type { PublicMarket } from "./market";

// 공공데이터 공식명이 사람들이 검색하는 이름과 다른 시장. 검색 화면(제목·H1·링크)에만 쓰고 주소(slug)는 공식명 그대로 둔다.
// 근거: Google 트렌드 비교(2026-11-15). planning/2026-11-15-market-alias-draft.md
const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  "market-2279d714eda1634a": "구포시장", // 정이있는구포시장
  "market-c3983f871839ecc8": "속초중앙시장", // 속초종합중앙시장
  "market-9a33164f76fa5a0d": "한림오일시장", // 한림민속오일시장(한림오일시장)
  "market-1beae503f360cf74": "원주 민속풍물시장", // 민속풍물시장
  "market-71be3409d13899e2": "순천 웃장", // 웃장
  "market-64f80404644775de": "순천 아랫장", // 순천시아랫장(순천아랫장)
};

export function getMarketDisplayName(market: Pick<PublicMarket, "id" | "name">): string {
  return DISPLAY_NAMES[market.id] ?? market.name;
}
