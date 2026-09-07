import type { MetadataRoute } from "next";

import { publicMarkets } from "../lib/market-catalog";
import { getMarketPagePath, isMarketIndexable, SITE_URL } from "../lib/market-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicMarkets.filter(isMarketIndexable).map((market) => ({
    url: `${SITE_URL}${getMarketPagePath(market)}`,
    ...(market.referenceDate ? { lastModified: market.referenceDate } : {}),
    changeFrequency: "monthly",
    priority: market.schedule.kind === "digit-pair" ? 0.8 : 0.6,
  }));
}
