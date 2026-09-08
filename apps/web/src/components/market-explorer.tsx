"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { filterMarkets, getDateRange, normalizeDirectDate, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { InstallPrompt } from "./install-prompt";
import { MarketDetail } from "./market-detail";
import { MarketFilters, type DateFilterMode } from "./market-filters";
import { MarketList } from "./market-list";
import { MarketMap } from "./market-map";

export interface ExplorerInitialState {
  query?: string;
  mode?: DateFilterMode;
  directDate?: string;
  selectedId?: string;
}

interface MarketExplorerProps {
  today?: Date;
  mapClientId?: string;
  initialState?: ExplorerInitialState;
}

const validModes = new Set<DateFilterMode>(["all", "today", "week", "weekend", "date"]);
const staticRenderDate = new Date(2000, 0, 15);

const readUrlState = (today: Date): ExplorerInitialState => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const modeValue = params.get("when") as DateFilterMode | null;
  return {
    query: params.get("q") ?? "",
    mode: modeValue && validModes.has(modeValue) ? modeValue : "week",
    directDate: params.get("date") ?? toIsoDate(today),
    selectedId: params.get("market") ?? undefined,
  };
};

async function fetchMarkets(): Promise<PublicMarket[]> {
  const response = await fetch("/data/markets.json");
  if (!response.ok) throw new Error("시장 데이터를 불러오지 못했습니다.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("시장 데이터 형식이 올바르지 않습니다.");
  return data as PublicMarket[];
}

function MarketExplorerContent({ today: providedToday, mapClientId = "", initialState }: MarketExplorerProps) {
  const [today, setToday] = useState(() => providedToday ?? staticRenderDate);
  const resolvedInitial = useMemo(() => {
    const rawState = initialState ?? {};
    const mode = rawState.mode && validModes.has(rawState.mode) ? rawState.mode : "week";
    const directDate = toIsoDate(normalizeDirectDate(rawState.directDate ?? toIsoDate(today), today));
    return { ...rawState, mode, directDate };
  }, [initialState, today]);
  const [query, setQuery] = useState(resolvedInitial.query ?? "");
  const [mode, setMode] = useState<DateFilterMode>(resolvedInitial.mode ?? "week");
  const [directDate, setDirectDate] = useState(resolvedInitial.directDate ?? toIsoDate(today));
  const [selectedId, setSelectedId] = useState<string | null>(resolvedInitial.selectedId ?? null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [hasRestoredUrl, setHasRestoredUrl] = useState(false);
  const { data: markets = [], isPending, isError, refetch } = useQuery({
    queryKey: ["public-markets"],
    queryFn: fetchMarkets,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const range = useMemo(() => getDateRange(mode, today, directDate), [directDate, mode, today]);
  const referenceDate = range?.start ?? today;
  const includeDaily = mode === "all" || mode === "date";
  const filteredMarkets = useMemo(
    () => filterMarkets(markets, query, range, { includeDaily }),
    [includeDaily, markets, query, range],
  );
  const listedMarkets = useMemo(
    () => currentLocation ? sortMarketsByDistance(filteredMarkets, currentLocation) : filteredMarkets,
    [currentLocation, filteredMarkets],
  );
  const mapMissingCount = filteredMarkets.filter((market) => market.latitude === null || market.longitude === null).length;
  const selectedMarket = markets.find((market) => market.id === selectedId) ?? null;

  useEffect(() => {
    if (!isPending && selectedId && !filteredMarkets.some((market) => market.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredMarkets, isPending, selectedId]);

  useEffect(() => {
    const clientToday = providedToday ?? new Date();
    if (!providedToday) setToday(clientToday);
    const urlState = readUrlState(clientToday);
    setQuery(urlState.query ?? "");
    setMode(urlState.mode ?? "week");
    setDirectDate(urlState.directDate ?? toIsoDate(clientToday));
    setSelectedId(urlState.selectedId ?? null);
    setHasRestoredUrl(true);
  }, [providedToday]);

  useEffect(() => {
    if (!hasRestoredUrl) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (mode !== "week") params.set("when", mode);
    if (mode === "date") params.set("date", directDate);
    if (selectedId) params.set("market", selectedId);
    const suffix = params.toString();
    window.history.replaceState(null, "", suffix ? `/?${suffix}` : "/");
  }, [directDate, hasRestoredUrl, mode, query, selectedId]);

  const selectMarket = useCallback((market: PublicMarket) => setSelectedId(market.id), []);
  const resetFilters = () => {
    setQuery("");
    setMode("week");
    setDirectDate(toIsoDate(today));
    setSelectedId(null);
  };

  return (
    <main className="explorer-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="오늘 장날 홈">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><h1>오늘 장날</h1><small>전국 5일장·전통시장 일정 지도</small></span>
        </a>
        <div className="header-actions">
          <div className="data-badge"><span aria-hidden="true" /> 전국 시장 {isPending ? "…" : `${markets.length.toLocaleString("ko-KR")}곳`}</div>
          <a className="feedback-link" href="/report?kind=service">불편 신고</a>
        </div>
      </header>

      <InstallPrompt />

      <MarketFilters
        mode={mode}
        query={query}
        directDate={directDate}
        minDate={toIsoDate(today)}
        onModeChange={setMode}
        onQueryChange={setQuery}
        onDirectDateChange={(date) => {
          setDirectDate(toIsoDate(normalizeDirectDate(date, today)));
          setMode("date");
        }}
      />

      <div className={`explorer-grid ${selectedMarket ? "has-selection" : ""}`}>
        <aside className="list-pane" aria-label="시장 목록">
          <div className="list-heading">
            <div>
              <p>{mode === "all" ? "전체 전통시장" : mode === "date" ? "선택한 날짜에 운영하는 시장" : "선택한 기간의 장날 시장"}</p>
              <strong>{filteredMarkets.length}곳</strong>
              {mapMissingCount > 0 ? <small>지도 미표시 {mapMissingCount}곳</small> : null}
            </div>
            <span>{query ? `“${query}” 검색` : "전국"}</span>
          </div>

          {isPending ? (
            <div className="list-loading" role="status"><span /><span /><span /><p>시장 정보를 불러오는 중입니다.</p></div>
          ) : isError ? (
            <div className="empty-state">
              <h2>시장 정보를 불러오지 못했어요</h2>
              <p>잠시 후 다시 시도해 주세요.</p>
              <button type="button" className="secondary-button" onClick={() => void refetch()}>다시 시도</button>
            </div>
          ) : (
            <MarketList
              markets={listedMarkets}
              referenceDate={referenceDate}
              selectedId={selectedId}
              onSelect={selectMarket}
              onReset={resetFilters}
              currentLocation={currentLocation}
            />
          )}
        </aside>

        <MarketMap
          markets={filteredMarkets}
          referenceDate={referenceDate}
          selectedId={selectedId}
          clientId={mapClientId}
          onSelect={selectMarket}
          onLocationChange={setCurrentLocation}
        />

        <aside className="detail-pane" aria-live="polite">
          <MarketDetail market={selectedMarket} today={today} onClose={() => setSelectedId(null)} />
        </aside>
      </div>

    </main>
  );
}

export function MarketExplorer(props: MarketExplorerProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={queryClient}><MarketExplorerContent {...props} /></QueryClientProvider>;
}
