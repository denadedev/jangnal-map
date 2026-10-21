import type { PublicMarket } from "../market";
import type { MarketEditorialContent } from "../market-editorial";
import type { MarketHighlight } from "../market-highlight";
import { getMarketBrowsePath, createMarketSlug } from "../market-path";
import { getMarketDistrict, getMarketRegion, REGIONS, type Region, type RegionSlug } from "../region";
import { buildRegionGuide } from "../region-guide";
import { getPatternOf, type DayPattern, type MarketLink } from "../jangnal-dates";

/** JSON이든 DB든 화면이 읽는 시장 데이터 한 벌. */
export interface CatalogSnapshot {
  markets: PublicMarket[];
  editorial: MarketEditorialContent[];
  /** 승인된 방문자 제보. 카테고리 순, 그 안에서 승인 순. */
  highlights: MarketHighlight[];
}

export const LAUNCH_MIN_MARKETS = 20;

const koreanOrder = (a: string, b: string): number => a.localeCompare(b, "ko-KR");
const regionIndex = (market: PublicMarket): number => {
  const region = getMarketRegion(market);
  return region ? REGIONS.indexOf(region) : REGIONS.length;
};

// DB에는 시장 순서 컬럼이 없어서, 두 출처 모두 시·도 → 시·군·구 → 이름 순으로 맞춘다.
export function sortMarkets(markets: readonly PublicMarket[]): PublicMarket[] {
  return [...markets].sort((a, b) => regionIndex(a) - regionIndex(b)
    || koreanOrder(getMarketDistrict(a), getMarketDistrict(b))
    || koreanOrder(a.name, b.name)
    || a.id.localeCompare(b.id));
}

const addressPrefix = (market: PublicMarket): string =>
  (market.roadAddress ?? market.lotAddress ?? "").split(/\s+/).slice(0, 2).join(" ");

export function createCatalog({ markets, editorial, highlights }: CatalogSnapshot) {
  const editorialById = new Map(editorial.map((entry) => [entry.marketId, entry]));
  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const marketsBySlug = new Map(markets.map((market) => [createMarketSlug(market), market]));
  const reviewedMarketIds: ReadonlySet<string> = new Set(editorialById.keys());
  const highlightsByMarket = new Map<string, MarketHighlight[]>();
  for (const highlight of highlights) highlightsByMarket.set(highlight.marketId, [...(highlightsByMarket.get(highlight.marketId) ?? []), highlight]);

  const isMarketIndexable = (market: PublicMarket): boolean =>
    market.status === "운영" && market.schedule.kind !== "unknown" && reviewedMarketIds.has(market.id);

  const periodicMarkets = markets.filter((market) => market.status === "운영" && market.schedule.kind === "digit-pair");
  const regionMarkets = new Map<RegionSlug, PublicMarket[]>(REGIONS.map((region) => [
    region.slug,
    periodicMarkets.filter((market) => getMarketRegion(market)?.slug === region.slug),
  ]));
  const getRegionMarkets = (slug: RegionSlug): PublicMarket[] => regionMarkets.get(slug) ?? [];
  const isLaunchRegion = (slug: RegionSlug): boolean => getRegionMarkets(slug).length >= LAUNCH_MIN_MARKETS;

  return {
    markets,
    reviewedMarketIds,
    reviewedMarkets: markets.filter((market) => reviewedMarketIds.has(market.id)),
    periodicMarkets,
    findMarketById: (id: string): PublicMarket | undefined => marketsById.get(id),
    findMarketBySlug(slug: string): PublicMarket | undefined {
      try {
        return marketsBySlug.get(decodeURIComponent(slug));
      } catch {
        return undefined;
      }
    },
    findMarketEditorial: (marketId: string): MarketEditorialContent | undefined => editorialById.get(marketId),
    findMarketHighlights: (marketId: string): MarketHighlight[] => highlightsByMarket.get(marketId) ?? [],
    isMarketIndexable,
    findRelatedMarkets(market: PublicMarket, limit = 6): PublicMarket[] {
      const prefix = addressPrefix(market);
      if (!prefix) return [];
      return markets
        .filter((candidate) => candidate.id !== market.id && isMarketIndexable(candidate) && addressPrefix(candidate) === prefix)
        .slice(0, limit);
    },
    getRegionMarkets,
    getPatternMarkets: (pattern: DayPattern): PublicMarket[] =>
      periodicMarkets.filter((market) => getPatternOf(market) === pattern),
    isLaunchRegion,
    launchRegions: (): Region[] => REGIONS.filter((region) => isLaunchRegion(region.slug)),
    getRegionGuide: (region: Region) => buildRegionGuide(region, getRegionMarkets(region.slug)),
    toMarketLink(market: PublicMarket): MarketLink {
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
    },
  };
}

export type Catalog = ReturnType<typeof createCatalog>;
