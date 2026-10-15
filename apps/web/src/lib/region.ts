import type { PublicMarket } from "./market";

export type RegionSlug =
  | "seoul" | "busan" | "daegu" | "incheon" | "gwangju" | "daejeon" | "ulsan" | "sejong"
  | "gyeonggi" | "gangwon" | "chungbuk" | "chungnam" | "jeonbuk" | "jeonnam"
  | "gyeongbuk" | "gyeongnam" | "jeju";

export interface Region {
  slug: RegionSlug;
  name: string;
  shortName: string;
  prefixes: readonly string[];
}

export const REGIONS: readonly Region[] = [
  { slug: "seoul", name: "서울특별시", shortName: "서울", prefixes: ["서울특별시"] },
  { slug: "busan", name: "부산광역시", shortName: "부산", prefixes: ["부산광역시"] },
  { slug: "daegu", name: "대구광역시", shortName: "대구", prefixes: ["대구광역시"] },
  { slug: "incheon", name: "인천광역시", shortName: "인천", prefixes: ["인천광역시"] },
  { slug: "gwangju", name: "광주광역시", shortName: "광주", prefixes: ["광주광역시"] },
  { slug: "daejeon", name: "대전광역시", shortName: "대전", prefixes: ["대전광역시"] },
  { slug: "ulsan", name: "울산광역시", shortName: "울산", prefixes: ["울산광역시"] },
  { slug: "sejong", name: "세종특별자치시", shortName: "세종", prefixes: ["세종특별자치시"] },
  { slug: "gyeonggi", name: "경기도", shortName: "경기", prefixes: ["경기도"] },
  { slug: "gangwon", name: "강원특별자치도", shortName: "강원", prefixes: ["강원특별자치도"] },
  { slug: "chungbuk", name: "충청북도", shortName: "충북", prefixes: ["충청북도"] },
  { slug: "chungnam", name: "충청남도", shortName: "충남", prefixes: ["충청남도"] },
  { slug: "jeonbuk", name: "전북특별자치도", shortName: "전북", prefixes: ["전북특별자치도", "전북특별차치도", "전라북도"] },
  { slug: "jeonnam", name: "전라남도", shortName: "전남", prefixes: ["전라남도"] },
  { slug: "gyeongbuk", name: "경상북도", shortName: "경북", prefixes: ["경상북도"] },
  { slug: "gyeongnam", name: "경상남도", shortName: "경남", prefixes: ["경상남도"] },
  { slug: "jeju", name: "제주특별자치도", shortName: "제주", prefixes: ["제주특별자치도"] },
];

const addressWords = (market: PublicMarket): string[] =>
  (market.roadAddress ?? market.lotAddress ?? "").trim().split(/\s+/);

export function getMarketRegion(market: PublicMarket): Region | null {
  const first = addressWords(market)[0];
  return REGIONS.find(({ prefixes }) => prefixes.includes(first)) ?? null;
}

export function getMarketDistrict(market: PublicMarket): string {
  return addressWords(market)[1] ?? "";
}

export function findRegionBySlug(slug: string): Region | undefined {
  return REGIONS.find((region) => region.slug === slug);
}
