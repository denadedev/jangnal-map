import type { MetadataRoute } from "next";

import { loadCatalog } from "../lib/catalog/load";
import { DAY_PATTERNS } from "../lib/jangnal-landing";
import { getMarketPagePath, SITE_URL } from "../lib/market-seo";

// 요청 때 메모리의 시장 데이터 스냅샷으로 그린다. 빌드 때는 데이터를 읽지 않는다.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { markets, launchRegions, isMarketIndexable, findMarketEditorial, findMarketHighlights } = await loadCatalog();
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/onnuri`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/en`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/jangnal`, changeFrequency: "daily", priority: 0.9 },
    ...launchRegions().map((region) => ({ url: `${SITE_URL}/jangnal/${region.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...DAY_PATTERNS.map((pattern) => ({ url: `${SITE_URL}/jangnal/days/${pattern}`, changeFrequency: "daily" as const, priority: 0.7 })),
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    ...markets.filter(isMarketIndexable).map((market) => ({
      url: `${SITE_URL}${getMarketPagePath(market)}`,
      // 방문자 제보가 승인되면 페이지 내용이 바뀌므로 승인 시각도 후보에 넣는다.
      lastModified: [
        market.referenceDate ?? market.source.referenceDate ?? "",
        findMarketEditorial(market.id)!.reviewedAt,
        ...findMarketHighlights(market.id).map((highlight) => highlight.createdAt),
      ].sort().at(-1),
      changeFrequency: "monthly" as const,
      priority: market.schedule.kind === "digit-pair" ? 0.8 : 0.6,
    })),
  ];
}
