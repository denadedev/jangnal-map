import { MarketExplorer } from "../components/market-explorer";
import { loadCatalog } from "../lib/catalog/load";
import { formatSchedulePattern } from "../lib/market-view";
import { getMarketPagePath } from "../lib/market-path";
import { SITE_URL } from "../lib/market-seo";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "오늘 장날",
  alternateName: ["장날 지도", "오늘장날"],
  url: SITE_URL,
};

const featuredMarketIds = new Set([
  "market-389b4a24f06ccd11", // 용인중앙시장
  "market-f9785614947c1065", // 광장시장
  "market-c3983f871839ecc8", // 속초종합중앙시장
  "market-46dd8e03711ba7b6", // 북평민속시장
  "market-2190eaf44c48bbd8", // 제주시민속오일시장
]);

// 요청 때 메모리의 시장 데이터 스냅샷으로 그린다. 빌드 때는 데이터를 읽지 않는다.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { reviewedMarkets, isMarketIndexable, findMarketEditorial } = await loadCatalog();
  const indexableReviewedMarkets = reviewedMarkets.filter(isMarketIndexable);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
      />
      <MarketExplorer
        mapClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? ""}
        reviewedMarketIds={indexableReviewedMarkets.map((market) => market.id)}
        reviewedGuides={indexableReviewedMarkets.map((market) => ({
          id: market.id,
          name: market.name,
          schedule: formatSchedulePattern(market),
          href: getMarketPagePath(market),
          summary: featuredMarketIds.has(market.id) ? findMarketEditorial(market.id)?.summary : undefined,
        }))}
      />
    </>
  );
}
