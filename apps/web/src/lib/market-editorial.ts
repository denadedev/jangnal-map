import editorialData from "../../public/data/market-editorial.json";

import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";

export interface MarketEditorialSource {
  name: string;
  url: string;
  checkedAt: string;
}

export interface MarketEditorialContent {
  marketId: string;
  summary: string;
  visitTips: string[];
  transportation: string;
  parking: string;
  specialties: string[];
  nearbyMarketIds: string[];
  sources: MarketEditorialSource[];
  reviewedAt: string;
  status: "reviewed";
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateMarketEditorial(
  entries: readonly MarketEditorialContent[],
  markets: readonly PublicMarket[],
): string[] {
  const errors: string[] = [];
  const marketIds = new Set(markets.map((market) => market.id));
  const seenIds = new Set<string>();

  for (const entry of entries) {
    if (seenIds.has(entry.marketId)) errors.push(`duplicate marketId: ${entry.marketId}`);
    seenIds.add(entry.marketId);
    if (!marketIds.has(entry.marketId)) errors.push(`unknown marketId: ${entry.marketId}`);
    if (!entry.summary.trim()) errors.push(`missing summary: ${entry.marketId}`);
    if (entry.visitTips.length === 0 || entry.visitTips.some((tip) => !tip.trim())) {
      errors.push(`missing visitTips: ${entry.marketId}`);
    }
    if (!entry.transportation.trim()) errors.push(`missing transportation: ${entry.marketId}`);
    if (!entry.parking.trim()) errors.push(`missing parking: ${entry.marketId}`);
    if (entry.status !== "reviewed") errors.push(`invalid status: ${entry.marketId}`);
    if (!datePattern.test(entry.reviewedAt)) errors.push(`invalid reviewedAt: ${entry.marketId}`);

    const sourceUrls = new Set<string>();
    for (const source of entry.sources) {
      if (sourceUrls.has(source.url)) errors.push(`duplicate source URL: ${entry.marketId}`);
      sourceUrls.add(source.url);
      try {
        if (new URL(source.url).protocol !== "https:") errors.push(`source must use https: ${entry.marketId}`);
      } catch {
        errors.push(`invalid source URL: ${entry.marketId}`);
      }
      if (!datePattern.test(source.checkedAt)) errors.push(`invalid source date: ${entry.marketId}`);
    }

    for (const nearbyId of entry.nearbyMarketIds) {
      if (!marketIds.has(nearbyId)) errors.push(`unknown nearbyMarketId: ${nearbyId}`);
    }
  }

  return errors;
}

export const marketEditorialEntries = editorialData as MarketEditorialContent[];
const editorialById = new Map(marketEditorialEntries.map((entry) => [entry.marketId, entry]));

export const reviewedMarketIds = new Set(editorialById.keys());
export const reviewedMarkets = publicMarkets.filter((market) => reviewedMarketIds.has(market.id));

export function findMarketEditorial(marketId: string): MarketEditorialContent | undefined {
  return editorialById.get(marketId);
}
