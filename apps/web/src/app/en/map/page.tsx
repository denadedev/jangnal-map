import type { Metadata } from "next";

import { MarketExplorer } from "../../../components/market-explorer";
import { loadCatalog } from "../../../lib/catalog/load";
import { OG_IMAGE } from "../../../lib/site-config";

export const metadata: Metadata = {
  title: { absolute: "Explore Korean Market Days | K Market Day" },
  description: "Find traditional markets by region and date on a map of Korea.",
  alternates: { canonical: "/en/map" },
  robots: { index: false, follow: true },
  openGraph: {
    images: [OG_IMAGE],
    title: "Explore Korean Market Days | K Market Day",
    description: "Find traditional markets by region and date on a map of Korea.",
    url: "/en/map",
    siteName: "K Market Day",
    locale: "en_US",
    type: "website",
  },
};

// 요청 때 메모리의 시장 데이터 스냅샷으로 그린다. 빌드 때는 데이터를 읽지 않는다.
export const dynamic = "force-dynamic";

export default async function EnglishMarketMapPage() {
  const { reviewedMarkets, isMarketIndexable } = await loadCatalog();
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
