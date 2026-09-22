import { MarketExplorer } from "../components/market-explorer";
import { reviewedMarkets } from "../lib/market-editorial";
import { formatSchedulePattern } from "../lib/market-view";
import { getMarketPagePath } from "../lib/market-path";
import { isMarketIndexable, SITE_URL } from "../lib/market-seo";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "오늘 장날",
  alternateName: ["장날 지도", "오늘장날"],
  url: SITE_URL,
};

export default function HomePage() {
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
        }))}
      />
    </>
  );
}
