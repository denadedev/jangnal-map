import { MarketExplorer } from "../components/market-explorer";
import { SITE_URL } from "../lib/market-seo";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "오늘 장날",
  alternateName: ["장날 지도", "jangnal-map.vercel.app"],
  url: SITE_URL,
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
      />
      <MarketExplorer mapClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? ""} />
    </>
  );
}
