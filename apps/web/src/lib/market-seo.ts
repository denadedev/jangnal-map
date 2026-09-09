import type { PublicMarket } from "./market";
import { formatSchedulePattern } from "./market-view";
import { publicMarkets } from "./market-catalog";
import { createMarketSlug } from "./market-path";

export { createMarketSlug, getMarketPagePath } from "./market-path";

export const SITE_URL = "https://jangnal.spamfam.kr";

const marketsBySlug = new Map(publicMarkets.map((market) => [createMarketSlug(market), market] as const));

export function findMarketBySlug(slug: string): PublicMarket | undefined {
  try {
    return marketsBySlug.get(decodeURIComponent(slug));
  } catch {
    return undefined;
  }
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

  if (market.onnuri && market.schedule.kind !== "unknown") {
    const total = market.onnuri.totalCount.toLocaleString("ko-KR");
    const digital = market.onnuri.digitalCount.toLocaleString("ko-KR");
    const paper = market.onnuri.paperCount.toLocaleString("ko-KR");
    const schedule = market.schedule.kind === "digit-pair"
      ? formatSchedulePattern(market)
      : "매일 운영";
    return {
      title: market.schedule.kind === "digit-pair"
        ? `${market.name} 장날·온누리상품권 가맹점 ${total}곳 | 오늘 장날`
        : `${market.name} 온누리상품권 가맹점 ${total}곳 | 오늘 장날`,
      description: `${locationPrefix}${market.name}의 ${schedule}과 온누리상품권 가맹점 ${total}곳, 디지털 ${digital}곳·지류 ${paper}곳, 주소와 주차 정보를 확인하세요.`,
    };
  }

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
