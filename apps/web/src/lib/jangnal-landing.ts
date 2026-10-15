import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";
import { reviewedMarketIds } from "./market-editorial";
import { getMarketBrowsePath } from "./market-path";
import { findRegionEditorial } from "./region-editorial";
import { getMarketDistrict, getMarketRegion, REGIONS, type Region, type RegionSlug } from "./region";
import { getPatternOf, type DayPattern, type MarketLink } from "./jangnal-dates";

export const LAUNCH_MIN_MARKETS = 20;

export const periodicMarkets = publicMarkets.filter(
  (market) => market.status === "운영" && market.schedule.kind === "digit-pair",
);

const koreanOrder = (a: string, b: string): number => a.localeCompare(b, "ko-KR");

export function getRegionMarkets(slug: RegionSlug): PublicMarket[] {
  return periodicMarkets.filter((market) => getMarketRegion(market)?.slug === slug);
}

export function getPatternMarkets(pattern: DayPattern): PublicMarket[] {
  return periodicMarkets.filter((market) => getPatternOf(market) === pattern);
}

const sortByName = (markets: PublicMarket[]): PublicMarket[] =>
  [...markets].sort((a, b) => koreanOrder(a.name, b.name));

export function groupByDistrict(markets: PublicMarket[]): { district: string; markets: PublicMarket[] }[] {
  const groups = new Map<string, PublicMarket[]>();
  for (const market of markets) {
    const district = getMarketDistrict(market);
    groups.set(district, [...(groups.get(district) ?? []), market]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => koreanOrder(a, b))
    .map(([district, items]) => ({ district, markets: sortByName(items) }));
}

export function groupByRegion(markets: PublicMarket[]): { region: Region; markets: PublicMarket[] }[] {
  return REGIONS
    .map((region) => ({ region, markets: sortByName(markets.filter((market) => getMarketRegion(market)?.slug === region.slug)) }))
    .filter(({ markets: items }) => items.length > 0);
}

export function isLaunchRegion(slug: RegionSlug): boolean {
  return getRegionMarkets(slug).length >= LAUNCH_MIN_MARKETS && findRegionEditorial(slug) !== undefined;
}

export const launchRegions = (): Region[] => REGIONS.filter((region) => isLaunchRegion(region.slug));

export function toMarketLink(market: PublicMarket): MarketLink {
  const reviewed = reviewedMarketIds.has(market.id);
  return {
    id: market.id,
    name: market.name,
    district: getMarketDistrict(market),
    marketType: market.marketType,
    schedule: market.schedule,
    hasParking: market.hasParking,
    href: getMarketBrowsePath(market, reviewed),
    reviewed,
  };
}

export * from "./jangnal-dates";
