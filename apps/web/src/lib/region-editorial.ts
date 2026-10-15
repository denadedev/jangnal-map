import editorialData from "../../public/data/region-editorial.json";

import type { PublicMarket } from "./market";
import type { MarketEditorialSource } from "./market-editorial";
import { findRegionBySlug, getMarketRegion, type RegionSlug } from "./region";

export interface RegionEditorialContent {
  regionSlug: RegionSlug;
  summary: string;
  highlights: { marketId: string; note: string }[];
  visitTips: string[];
  sources: MarketEditorialSource[];
  reviewedAt: string;
  status: "reviewed";
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateRegionEditorial(
  entries: readonly RegionEditorialContent[],
  markets: readonly PublicMarket[],
): string[] {
  const errors: string[] = [];
  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const seen = new Set<string>();

  for (const entry of entries) {
    const slug = entry.regionSlug;
    if (seen.has(slug)) errors.push(`duplicate regionSlug: ${slug}`);
    seen.add(slug);
    if (!findRegionBySlug(slug)) errors.push(`unknown regionSlug: ${slug}`);
    if (!entry.summary.trim()) errors.push(`missing summary: ${slug}`);
    if (entry.highlights.length < 2 || entry.highlights.length > 3) errors.push(`highlights must have 2-3 items: ${slug}`);
    for (const highlight of entry.highlights) {
      const market = marketsById.get(highlight.marketId);
      if (!market || getMarketRegion(market)?.slug !== slug || market.schedule.kind !== "digit-pair" || market.status !== "운영") {
        errors.push(`highlight is not a periodic market in region: ${highlight.marketId}`);
      }
      if (!highlight.note.trim()) errors.push(`missing highlight note: ${highlight.marketId}`);
    }
    if (entry.visitTips.length === 0 || entry.visitTips.some((tip) => !tip.trim())) errors.push(`missing visitTips: ${slug}`);
    if (entry.sources.length === 0) errors.push(`missing sources: ${slug}`);
    for (const source of entry.sources) {
      try {
        if (new URL(source.url).protocol !== "https:") errors.push(`source must use https: ${slug}`);
      } catch {
        errors.push(`invalid source URL: ${slug}`);
      }
      if (!datePattern.test(source.checkedAt)) errors.push(`invalid source date: ${slug}`);
    }
    if (entry.status !== "reviewed") errors.push(`invalid status: ${slug}`);
    if (!datePattern.test(entry.reviewedAt)) errors.push(`invalid reviewedAt: ${slug}`);
  }

  return errors;
}

export const regionEditorialEntries = editorialData as RegionEditorialContent[];
const editorialBySlug = new Map(regionEditorialEntries.map((entry) => [entry.regionSlug, entry]));

export function findRegionEditorial(slug: RegionSlug): RegionEditorialContent | undefined {
  return editorialBySlug.get(slug);
}
