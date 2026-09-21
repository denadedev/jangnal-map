"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { getMarketBrowsePath } from "../lib/market-path";
import { filterMarkets, getDateRange, normalizeDirectDate, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { MobileAppBar } from "./mobile-app-bar";
import { MobileMarketSheet, type SheetMode, type SheetSnap } from "./mobile-market-sheet";
import { MarketDetail } from "./market-detail";
import { MarketFilters, type DateFilterMode } from "./market-filters";
import { MarketList } from "./market-list";
import { MarketMap } from "./market-map";
import { ReviewedMarketGuides, type ReviewedMarketGuide } from "./reviewed-market-guides";
import { SiteFooter } from "./site-footer";

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
  reviewedMarketIds?: string[];
  reviewedGuides?: ReviewedMarketGuide[];
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

const emptyReviewedMarketIds: string[] = [];

function MarketExplorerContent({ today: providedToday, mapClientId = "", initialState, reviewedMarketIds = emptyReviewedMarketIds, reviewedGuides = [] }: MarketExplorerProps) {
  const reviewedMarketIdSet = useMemo(() => new Set(reviewedMarketIds), [reviewedMarketIds]);
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
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("half");
  const [sheetMode, setSheetMode] = useState<SheetMode>(resolvedInitial.selectedId ? "detail" : "results");
  const previousSheetSnap = useRef<SheetSnap>("half");
  const selectedOriginId = useRef<string | null>(null);
  const resultScrollTop = useRef(0);
  const mobileSheetContentRef = useRef<HTMLDivElement | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [hasRestoredUrl, setHasRestoredUrl] = useState(false);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">(mapClientId ? "idle" : "error");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSheetHeight, setMobileSheetHeight] = useState(0);
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
      setSheetMode("results");
      setSheetSnap("half");
      selectedOriginId.current = null;
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
    const nextState = { ...(window.history.state ?? {}) } as Record<string, unknown>;
    if (selectedId) nextState.mobileMarket = selectedId;
    else delete nextState.mobileMarket;
    window.history.replaceState(nextState, "", suffix ? `/?${suffix}` : "/");
  }, [directDate, hasRestoredUrl, mode, query, selectedId]);

  const restoreResultContext = useCallback(() => {
    const originId = selectedOriginId.current;
    window.requestAnimationFrame(() => {
      if (mobileSheetContentRef.current) mobileSheetContentRef.current.scrollTop = resultScrollTop.current;
      if (originId) {
        const origin = Array.from(document.querySelectorAll<HTMLElement>(".mobile-market-sheet [data-market-id]"))
          .find(
          (element) => element.dataset.marketId === originId,
          );
        origin?.focus();
      }
      selectedOriginId.current = null;
    });
  }, []);

  const selectMarket = useCallback((market: PublicMarket) => {
    previousSheetSnap.current = sheetSnap;
    selectedOriginId.current = market.id;
    resultScrollTop.current = mobileSheetContentRef.current?.scrollTop ?? 0;
    const params = new URLSearchParams(window.location.search);
    params.set("market", market.id);
    window.history.pushState({ ...(window.history.state ?? {}), mobileMarket: market.id }, "", `/?${params.toString()}`);
    setSelectedId(market.id);
    setSheetMode("detail");
    setSheetSnap("full");
  }, [sheetSnap]);
  const closeMarket = useCallback(() => {
    const selected = selectedOriginId.current;
    if (selected && window.history.state?.mobileMarket === selected) {
      window.history.back();
      return;
    }
    setSelectedId(null);
    setSheetMode("results");
    setSheetSnap(previousSheetSnap.current);
    restoreResultContext();
  }, [restoreResultContext]);
  const closeMarketToMap = useCallback(() => {
    previousSheetSnap.current = "collapsed";
    closeMarket();
  }, [closeMarket]);
  const resetFilters = () => {
    setQuery("");
    setMode("week");
    setDirectDate(toIsoDate(today));
    closeMarket();
  };

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 700px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!hasRestoredUrl || !selectedId) return;
    setSheetMode("detail");
    setSheetSnap("full");
  }, [hasRestoredUrl, selectedId]);

  useEffect(() => {
    const handlePopState = () => {
      const marketId = new URLSearchParams(window.location.search).get("market");
      if (marketId) {
        setSelectedId(marketId);
        setSheetMode("detail");
        setSheetSnap("full");
        return;
      }
      setSelectedId(null);
      setSheetMode("results");
      setSheetSnap(previousSheetSnap.current);
      restoreResultContext();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [restoreResultContext]);

  const listHeading = (
    <div className="list-heading">
      <div>
        <p>{mode === "all" ? "전체 전통시장" : mode === "date" ? "선택한 날짜에 운영하는 시장" : "선택한 기간의 장날 시장"}</p>
        <strong>{filteredMarkets.length}곳</strong>
        {mapMissingCount > 0 ? <small>지도 미표시 {mapMissingCount}곳</small> : null}
      </div>
      <span>{query ? `“${query}” 검색` : "전국"}</span>
    </div>
  );

  const marketListContent = isPending ? (
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
      reviewedMarketIds={reviewedMarketIdSet}
      referenceDate={referenceDate}
      selectedId={selectedId}
      onSelect={selectMarket}
      onReset={resetFilters}
      currentLocation={currentLocation}
    />
  );

  const handleMapStatus = useCallback((status: "idle" | "loading" | "ready" | "error") => {
    setMapStatus(status);
    if (status === "error") {
      setSheetMode("results");
      setSheetSnap("full");
    }
  }, []);

  const focusSearchAfterLocationError = useCallback((message: string, permissionDenied: boolean) => {
    if (!permissionDenied) return;
    window.setTimeout(() => document.querySelector<HTMLInputElement>('.search-field input[type="search"]')?.focus(), 0);
    void message;
  }, []);

  return (
    <main className="explorer-shell">
      <MobileAppBar />
      <header className="app-header">
        <a className="brand" href="/" aria-label="오늘 장날 홈">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><h1>오늘 장날</h1><small>전국 5일장·전통시장 일정 지도</small></span>
        </a>
        <div className="header-actions">
          <div className="data-badge"><span aria-hidden="true" /> 전국 시장 {isPending ? "…" : `${markets.length.toLocaleString("ko-KR")}곳`}</div>
          <a className="feedback-link" href="/onnuri">온누리상품권</a>
          <a className="feedback-link" href="/report?kind=service">불편 신고</a>
        </div>
      </header>

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

      {reviewedGuides.length > 0 ? <ReviewedMarketGuides guides={reviewedGuides} /> : null}

      <div className={`explorer-grid ${selectedMarket ? "has-selection" : ""}`}>
        <aside className="list-pane" aria-label="시장 목록">
          {listHeading}
          {marketListContent}
        </aside>

        <MarketMap
          markets={filteredMarkets}
          referenceDate={referenceDate}
          selectedId={selectedId}
          clientId={mapClientId}
          mobileSheetHeight={isMobile && sheetSnap !== "full" ? mobileSheetHeight : 0}
          onSelect={selectMarket}
          onLocationChange={setCurrentLocation}
          onStatusChange={handleMapStatus}
          onLocationError={focusSearchAfterLocationError}
        />

        <aside className="detail-pane" aria-live="polite">
          <MarketDetail
            market={selectedMarket}
            sharePath={selectedMarket ? getMarketBrowsePath(selectedMarket, reviewedMarketIdSet.has(selectedMarket.id)) : undefined}
            today={today}
            onClose={closeMarket}
          />
        </aside>

        {isMobile ? (
          <MobileMarketSheet
            snap={sheetSnap}
            onSnapChange={setSheetSnap}
            mode={sheetMode}
            onModeChange={setSheetMode}
            title={sheetMode === "detail" && selectedMarket ? `${selectedMarket.name} 상세` : `${filteredMarkets.length}곳 시장 결과`}
            describedBy="mobile-market-sheet-status"
            contentRef={mobileSheetContentRef}
            onHeightChange={setMobileSheetHeight}
            onClose={closeMarketToMap}
          >
            {sheetMode === "detail" ? (
              <MarketDetail
                market={selectedMarket}
                sharePath={selectedMarket ? getMarketBrowsePath(selectedMarket, reviewedMarketIdSet.has(selectedMarket.id)) : undefined}
                today={today}
                onClose={closeMarket}
              />
            ) : (
              <div className="mobile-market-results" data-map-status={mapStatus}>
                {listHeading}
                {marketListContent}
              </div>
            )}
          </MobileMarketSheet>
        ) : null}
      </div>

      <SiteFooter />

    </main>
  );
}

export function MarketExplorer(props: MarketExplorerProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={queryClient}><MarketExplorerContent {...props} /></QueryClientProvider>;
}
