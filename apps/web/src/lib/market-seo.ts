import type { PublicMarket } from "./market";
import { formatSchedulePattern } from "./market-view";
import { publicMarkets } from "./market-catalog";

export const SITE_URL = "https://jangnal-map.vercel.app";

const normalizeSlugPart = (value: string): string => value
  .normalize("NFKC")
  .trim()
  .replace(/[^0-9A-Za-z가-힣]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLocaleLowerCase("ko-KR");

export function createMarketSlug(market: PublicMarket): string {
  const idSuffix = market.id.replace(/^market-/, "").slice(0, 8);
  return `${normalizeSlugPart(market.name)}-${idSuffix}`;
}

export function getMarketPagePath(market: PublicMarket): string {
  return `/markets/${createMarketSlug(market)}`;
}

const marketsBySlug = new Map(publicMarkets.map((market) => [createMarketSlug(market), market] as const));

export function findMarketBySlug(slug: string): PublicMarket | undefined {
  return marketsBySlug.get(decodeURIComponent(slug));
}

export function isMarketIndexable(market: PublicMarket): boolean {
  return market.status === "운영" && market.schedule.kind !== "unknown";
}

const getRegion = (market: PublicMarket): string => {
  const address = market.roadAddress ?? market.lotAddress ?? "";
  return address.split(/\s+/).slice(0, 2).join(" ");
};

export function createMarketSeoText(market: PublicMarket): { title: string; description: string } {
  const region = getRegion(market);
  const locationPrefix = region ? `${region} ` : "";

  if (market.schedule.kind === "digit-pair") {
    const schedule = formatSchedulePattern(market);
    return {
      title: `${market.name} 장날 · ${schedule} | 오늘 장날`,
      description: `${locationPrefix}${market.name}은 ${schedule}입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.`,
    };
  }

  if (market.schedule.kind === "daily") {
    return {
      title: `${market.name} 영업일 · 매일 운영 | 오늘 장날`,
      description: `${locationPrefix}${market.name}은 매일 운영하는 전통시장입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.`,
    };
  }

  return {
    title: `${market.name} 전통시장 정보 | 오늘 장날`,
    description: `${locationPrefix}${market.name}의 주소와 방문 정보를 확인해 보세요. 운영 일정은 확인이 필요합니다.`,
  };
}
