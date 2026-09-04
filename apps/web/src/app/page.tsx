import { MarketExplorer, type ExplorerInitialState } from "../components/market-explorer";
import type { DateFilterMode } from "../components/market-filters";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const firstValue = (value: string | string[] | undefined): string | undefined => Array.isArray(value) ? value[0] : value;

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const initialState: ExplorerInitialState = {
    query: firstValue(params.q),
    mode: firstValue(params.when) as DateFilterMode | undefined,
    directDate: firstValue(params.date),
    selectedId: firstValue(params.market),
  };

  return <MarketExplorer mapClientId={process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID ?? ""} initialState={initialState} />;
}
