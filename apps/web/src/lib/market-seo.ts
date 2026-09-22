import type { PublicMarket } from "./market";
import { formatScheduleDates, formatSchedulePattern } from "./market-view";
import { publicMarkets } from "./market-catalog";
import { reviewedMarketIds } from "./market-editorial";
import { createMarketSlug } from "./market-path";
import { SITE_URL } from "./site-config";

export { createMarketSlug, getMarketPagePath } from "./market-path";
export { SITE_URL } from "./site-config";

const marketsBySlug = new Map(publicMarkets.map((market) => [createMarketSlug(market), market] as const));

export function findMarketBySlug(slug: string): PublicMarket | undefined {
  try {
    return marketsBySlug.get(decodeURIComponent(slug));
  } catch {
    return undefined;
  }
}

export function isMarketIndexable(market: PublicMarket): boolean {
  return market.status === "운영" && market.schedule.kind !== "unknown" && reviewedMarketIds.has(market.id);
}

export function findRelatedMarkets(market: PublicMarket, limit = 6): PublicMarket[] {
  const region = getRegion(market);
  if (!region) return [];

  return publicMarkets
    .filter((candidate) => candidate.id !== market.id && isMarketIndexable(candidate) && getRegion(candidate) === region)
    .slice(0, limit);
}

export function createMarketScheduleAnswer(market: PublicMarket): string {
  if (market.schedule.kind === "digit-pair") {
    return `${market.name} 장날은 매월 ${formatScheduleDates(market)}입니다.`;
  }
  if (market.schedule.kind === "daily") {
    return `${market.name}은 매일 운영합니다.`;
  }
  return `${market.name}의 운영 일정은 확인이 필요합니다.`;
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
        ? `${market.name} 장날 날짜 (${schedule}) | 오늘 장날`
        : `${market.name} 영업일 · 매일 운영 | 오늘 장날`,
      description: market.schedule.kind === "digit-pair"
        ? `${locationPrefix}${market.name} 장날은 매월 ${formatScheduleDates(market)}입니다. 온누리상품권 가맹점 ${total}곳, 디지털 ${digital}곳·지류 ${paper}곳, 주소와 주차 정보를 확인하세요.`
        : `${locationPrefix}${market.name}은 매일 운영합니다. 온누리상품권 가맹점 ${total}곳, 디지털 ${digital}곳·지류 ${paper}곳, 주소와 주차 정보를 확인하세요.`,
    };
  }

  if (market.schedule.kind === "digit-pair") {
    const schedule = formatSchedulePattern(market);
    return {
      title: `${market.name} 장날 날짜 (${schedule}) | 오늘 장날`,
      description: `${locationPrefix}${market.name} 장날은 매월 ${formatScheduleDates(market)}입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.`,
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
