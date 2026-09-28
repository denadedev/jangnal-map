import type { Metadata } from "next";

import { MarketExplorer } from "../../../components/market-explorer";
import { reviewedMarkets } from "../../../lib/market-editorial";
import { isMarketIndexable } from "../../../lib/market-seo";

export const metadata: Metadata = {
  title: { absolute: "Explore Korean Market Days | K Market Day" },
  description: "Find traditional markets by region and date on a map of Korea.",
  alternates: { canonical: "/en/map" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Explore Korean Market Days | K Market Day",
    description: "Find traditional markets by region and date on a map of Korea.",
    url: "/en/map",
    siteName: "K Market Day",
    locale: "en_US",
    type: "website",
  },
};

export default function EnglishMarketMapPage() {
  return (
    <div lang="en">
      <MarketExplorer
        locale="en"
        mapClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? ""}
        reviewedMarketIds={reviewedMarkets.filter(isMarketIndexable).map((market) => market.id)}
      />
    </div>
  );
}
