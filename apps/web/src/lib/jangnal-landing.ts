import type { PublicMarket } from "./market";
import { getMarketDistrict, getMarketRegion, REGIONS, type Region } from "./region";

const koreanOrder = (a: string, b: string): number => a.localeCompare(b, "ko-KR");

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

export * from "./jangnal-dates";
