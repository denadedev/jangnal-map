import { MarketExplorer } from "../components/market-explorer";

export default function HomePage() {
  return <MarketExplorer mapClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? ""} />;
}
