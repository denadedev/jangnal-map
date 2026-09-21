import { MarketExplorer } from "../components/market-explorer";
import { reviewedMarketIds, reviewedMarkets } from "../lib/market-editorial";
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
      />
      <MarketExplorer
        mapClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? ""}
        reviewedMarketIds={[...reviewedMarketIds]}
        reviewedGuides={reviewedMarkets.map((market) => ({
          id: market.id,
          name: market.name,
          schedule: formatSchedulePattern(market),
          href: getMarketPagePath(market),
        }))}
      />
    </>
  );
}
