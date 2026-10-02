import type { MetadataRoute } from "next";

import { publicMarkets } from "../lib/market-catalog";
import { findMarketEditorial } from "../lib/market-editorial";
import { getMarketPagePath, isMarketIndexable, SITE_URL } from "../lib/market-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/onnuri`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/en`, changeFrequency: "monthly", priority: 0.6 },
    ...publicMarkets.filter(isMarketIndexable).map((market) => ({
      url: `${SITE_URL}${getMarketPagePath(market)}`,
      lastModified: [market.referenceDate ?? market.source.referenceDate ?? "", findMarketEditorial(market.id)!.reviewedAt].sort().at(-1),
      changeFrequency: "monthly" as const,
      priority: market.schedule.kind === "digit-pair" ? 0.8 : 0.6,
    })),
  ];
}
