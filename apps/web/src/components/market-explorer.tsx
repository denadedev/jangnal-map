"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { SiteFooter } from "./site-footer";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { buildExplorerPath, type Locale } from "../lib/locale";
import { getMarketBrowsePath, getMarketPagePath } from "../lib/market-path";
import { filterMarkets, getDateRange, normalizeDirectDate, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { getKoreaCalendarDate, msUntilNextKoreaMidnight } from "../lib/korea-date";
import { resolveRegionAlias } from "../lib/region-aliases";
import { getUiCopy } from "../lib/ui-copy";
import { MobileHomeControls } from "./mobile-home-controls";
import { MobileMarketSheet, type SheetMode, type SheetSnap } from "./mobile-market-sheet";
import { MobileSearchScreen } from "./mobile-search-screen";
import { MarketDetail } from "./market-detail";
import type { DateFilterMode } from "./market-filters";
import { MarketList } from "./market-list";
import { MarketMap } from "./market-map";
import { ReviewedMarketGuides, type ReviewedMarketGuide } from "./reviewed-market-guides";

export interface ExplorerInitialState {
  query?: string;
  mode?: DateFilterMode;
  directDate?: string;
  selectedId?: string;
}

interface MarketExplorerProps {
  locale?: Locale;
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
type SelectionOrigin = { id: string; source: "map" | "list" };

function MarketExplorerContent({ locale = "ko", today: providedToday, mapClientId = "", initialState, reviewedMarketIds = emptyReviewedMarketIds, reviewedGuides = [] }: MarketExplorerProps) {
  const ui = getUiCopy(locale);
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
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>(resolvedInitial.selectedId ? "full" : "half");
  const [sheetMode, setSheetMode] = useState<SheetMode>(resolvedInitial.selectedId ? "detail" : "results");
  const previousSheetSnap = useRef<SheetSnap>("half");
  const selectedOrigin = useRef<SelectionOrigin | null>(null);
  const resultScrollTop = useRef(0);
  const mobileSheetContentRef = useRef<HTMLDivElement | null>(null);
  const mobileResultsRef = useRef<HTMLDivElement | null>(null);
  const pendingMapFocusIdRef = useRef<string | null>(null);
  const mapFocusFallbackTimerRef = useRef<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [hasRestoredUrl, setHasRestoredUrl] = useState(false);
  const [urlNotice, setUrlNotice] = useState("");
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">(mapClientId ? "idle" : "error");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const returnToSearchRef = useRef(false);
  useLayoutEffect(() => {
    if (sheetMode !== "results" && mobileSheetContentRef.current) mobileSheetContentRef.current.scrollTop = 0;
  }, [selectedId, sheetMode]);
  const { data: markets = [], isPending, isError, refetch } = useQuery({
    queryKey: ["public-markets"],
    queryFn: fetchMarkets,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const range = useMemo(() => getDateRange(mode, today, directDate), [directDate, mode, today]);
  const referenceDate = range?.start ?? today;
  const includeDaily = Boolean(query.trim()) || mode === "all" || mode === "date";
  const regionPrefixes = locale === "en" ? resolveRegionAlias(query) : null;
  const queryMatches = useMemo(
    () => filterMarkets(markets, query, null, { regionPrefixes }),
    [markets, query, regionPrefixes],
  );
  const filteredMarkets = useMemo(
    () => filterMarkets(markets, query, range, { includeDaily, regionPrefixes }),
    [includeDaily, markets, query, range, regionPrefixes],
  );
  const inactiveMarkets = useMemo(
    () => query.trim() ? queryMatches.filter((market) => !filteredMarkets.includes(market)) : [],
    [filteredMarkets, query, queryMatches],
  );
  const listedMarkets = useMemo(
    () => currentLocation ? sortMarketsByDistance(filteredMarkets, currentLocation) : filteredMarkets,
    [currentLocation, filteredMarkets],
  );
  const listedInactiveMarkets = useMemo(
    () => currentLocation ? sortMarketsByDistance(inactiveMarkets, currentLocation) : inactiveMarkets,
    [currentLocation, inactiveMarkets],
  );
  const displayedMarkets = query.trim() ? queryMatches : filteredMarkets;
  const dateReady = hasRestoredUrl || Boolean(providedToday);
  const rangeLabel = !dateReady ? ui.week : range
    ? `${range.start.getMonth() + 1}/${range.start.getDate()}${range.start.getTime() === range.end.getTime() ? "" : `–${range.end.getMonth() + 1}/${range.end.getDate()}`}`
    : ui.allMarkets;
  const selectedMarket = markets.find((market) => market.id === selectedId) ?? null;

  const handleDirectDateChange = useCallback((date: string) => {
    setDirectDate(toIsoDate(normalizeDirectDate(date, today)));
    setMode("date");
  }, [today]);

  const focusResultControl = useCallback(() => {
    document.querySelector<HTMLButtonElement>(
      '.mobile-primary-nav button[aria-current="page"], .mobile-view-switch button[aria-pressed="true"]',
    )?.focus();
  }, []);

  const focusRestoredMapSelection = useCallback((cameraRestored: boolean) => {
    const marketId = pendingMapFocusIdRef.current;
    if (!marketId) return;
    pendingMapFocusIdRef.current = null;
    if (mapFocusFallbackTimerRef.current !== null) {
      window.clearTimeout(mapFocusFallbackTimerRef.current);
      mapFocusFallbackTimerRef.current = null;
    }
    window.requestAnimationFrame(() => {
      if (!cameraRestored) {
        focusResultControl();
        return;
      }
      const marker = Array.from(document.querySelectorAll<HTMLElement>(".map-marker[data-market-id]"))
        .find((element) => element.dataset.marketId === marketId && element.isConnected);
      if (marker) marker.focus();
      else focusResultControl();
    });
  }, [focusResultControl]);

  useEffect(() => {
    if (!isPending && selectedId && !queryMatches.some((market) => market.id === selectedId)) {
      if (locale === "en") {
        const message = "That market is not available with the current filters. Showing the market list instead.";
        setUrlNotice((current) => current.includes(message) ? current : [current, message].filter(Boolean).join(" "));
      }
      setSelectedId(null);
      setSheetMode("results");
      setSheetSnap("collapsed");
      selectedOrigin.current = null;
      returnToSearchRef.current = false;
    }
  }, [hasRestoredUrl, isPending, locale, queryMatches, selectedId]);

  useEffect(() => {
    const clientToday = providedToday ?? getKoreaCalendarDate(new Date());
    if (!providedToday) setToday(clientToday);
    const urlState = readUrlState(clientToday);
    setQuery(urlState.query ?? "");
    setMode(urlState.mode ?? "week");
    const requestedDate = urlState.directDate ?? toIsoDate(clientToday);
    const normalizedDate = toIsoDate(normalizeDirectDate(requestedDate, clientToday));
    setDirectDate(normalizedDate);
    if (locale === "en" && urlState.mode === "date" && requestedDate !== normalizedDate) {
      const message = "The selected date has passed or is invalid, so the date was changed to today in Korea.";
      setUrlNotice((current) => current.includes(message) ? current : [current, message].filter(Boolean).join(" "));
    }
    setSelectedId(urlState.selectedId ?? null);
    setSheetMode(urlState.selectedId ? "detail" : "results");
    setSheetSnap(urlState.selectedId ? "full" : "half");
    setHasRestoredUrl(true);
  }, [locale, providedToday]);

  useEffect(() => {
    if (providedToday) return;
    const refresh = () => setToday(getKoreaCalendarDate(new Date()));
    const delay = msUntilNextKoreaMidnight(new Date());
    const timer = window.setTimeout(refresh, delay);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [providedToday, today]);

  useEffect(() => {
    if (!hasRestoredUrl) return;
    const normalizedDate = toIsoDate(normalizeDirectDate(directDate, today));
    if (normalizedDate === directDate) return;
    setDirectDate(normalizedDate);
    if (locale === "en" && mode === "date") {
      const message = "The selected date has passed or is invalid, so the date was changed to today in Korea.";
      setUrlNotice((current) => current.includes(message) ? current : [current, message].filter(Boolean).join(" "));
    }
  }, [directDate, hasRestoredUrl, locale, mode, today]);

  useEffect(() => {
    if (!hasRestoredUrl) return;
    const nextState = { ...(window.history.state ?? {}) } as Record<string, unknown>;
    if (selectedId) nextState.mobileMarket = selectedId;
    else {
      delete nextState.mobileMarket;
      delete nextState.mobileMarketView;
      delete nextState.mobileMarketSource;
      delete nextState.mobileMarketFromSearch;
      delete nextState.marketSelectionFromResults;
    }
    window.history.replaceState(nextState, "", buildExplorerPath(locale, { query, mode, directDate, marketId: selectedId }));
  }, [directDate, hasRestoredUrl, locale, mode, query, selectedId]);

  const restoreResultContext = useCallback(() => {
    if (returnToSearchRef.current) {
      returnToSearchRef.current = false;
      selectedOrigin.current = null;
      setIsSearchOpen(true);
      return;
    }
    const origin = selectedOrigin.current;
    if (origin?.source === "map" && mapStatus === "ready") {
      pendingMapFocusIdRef.current = origin.id;
      if (mapFocusFallbackTimerRef.current !== null) window.clearTimeout(mapFocusFallbackTimerRef.current);
      mapFocusFallbackTimerRef.current = window.setTimeout(() => {
        if (pendingMapFocusIdRef.current !== origin.id) return;
        pendingMapFocusIdRef.current = null;
        mapFocusFallbackTimerRef.current = null;
        focusResultControl();
      }, 1_000);
    }
    window.requestAnimationFrame(() => {
      if (mobileResultsRef.current) mobileResultsRef.current.scrollTop = resultScrollTop.current;
      if (!(origin?.source === "map" && mapStatus === "ready")) {
        if (origin?.source === "map" || !origin) {
          focusResultControl();
        } else {
          const originItem = Array.from(document.querySelectorAll<HTMLElement>(".mobile-market-results [data-market-id]"))
            .find((element) => element.dataset.marketId === origin.id);
          originItem?.focus();
        }
      }
      selectedOrigin.current = null;
    });
  }, [focusResultControl, mapStatus]);

  const selectMarket = useCallback((market: PublicMarket, source: "map" | "list") => {
    returnToSearchRef.current = isSearchOpen;
    pendingMapFocusIdRef.current = null;
    if (mapFocusFallbackTimerRef.current !== null) {
      window.clearTimeout(mapFocusFallbackTimerRef.current);
      mapFocusFallbackTimerRef.current = null;
    }
    const returnSnap = sheetMode === "results" ? sheetSnap : previousSheetSnap.current;
    previousSheetSnap.current = returnSnap;
    selectedOrigin.current = { id: market.id, source };
    resultScrollTop.current = mobileResultsRef.current?.scrollTop ?? 0;
    const view = "detail";
    const replacingSelection = selectedId !== null;
    window.history[replacingSelection ? "replaceState" : "pushState"]({
      ...(window.history.state ?? {}),
      mobileMarket: market.id,
      mobileMarketView: view,
      mobileMarketSource: source,
      mobileMarketFromSearch: isSearchOpen,
      mobileReturnSnap: returnSnap,
      marketSelectionFromResults: replacingSelection
        ? Boolean(window.history.state?.marketSelectionFromResults)
        : true,
    }, "", buildExplorerPath(locale, { query, mode, directDate, marketId: market.id }));
    setSelectedId(market.id);
    setSheetMode(view);
    setSheetSnap("full");
    setIsSearchOpen(false);
  }, [directDate, isSearchOpen, locale, mode, query, selectedId, sheetMode, sheetSnap]);
  const selectMapMarket = useCallback((market: PublicMarket) => selectMarket(market, "map"), [selectMarket]);
  const selectListMarket = useCallback((market: PublicMarket) => selectMarket(market, "list"), [selectMarket]);
  const closeMarket = useCallback(() => {
    const selected = selectedOrigin.current;
    if (selected && window.history.state?.mobileMarket === selected.id && window.history.state?.marketSelectionFromResults) {
      window.history.back();
      return;
    }
    setSelectedId(null);
    setSheetMode("results");
    setSheetSnap(previousSheetSnap.current);
    restoreResultContext();
  }, [restoreResultContext]);
  const resetFilters = () => {
    setUrlNotice("");
    setQuery("");
    setMode("week");
    setDirectDate(toIsoDate(today));
    closeMarket();
  };
  const clearDateFilter = () => setMode("all");

  useEffect(() => {
    const handlePopState = () => {
      const urlState = readUrlState(today);
      if (!urlState.selectedId && returnToSearchRef.current) {
        setSelectedId(null);
        setSheetMode("results");
        setSheetSnap(previousSheetSnap.current);
        restoreResultContext();
        return;
      }
      setQuery(urlState.query ?? "");
      setMode(urlState.mode ?? "week");
      const requestedDate = urlState.directDate ?? toIsoDate(today);
      const normalizedDate = toIsoDate(normalizeDirectDate(requestedDate, today));
      setDirectDate(normalizedDate);
      if (locale === "en" && urlState.mode === "date" && requestedDate !== normalizedDate) {
        const message = "The selected date has passed or is invalid, so the date was changed to today in Korea.";
        setUrlNotice((current) => current.includes(message) ? current : [current, message].filter(Boolean).join(" "));
      }
      const marketId = urlState.selectedId;
      if (marketId) {
        setSelectedId(marketId);
        const state = window.history.state as Record<string, unknown> | null;
        const hasMatchingState = state?.mobileMarket === marketId;
        setIsSearchOpen(false);
        returnToSearchRef.current = Boolean(hasMatchingState && state?.mobileMarketFromSearch);
        const view = "detail";
        const source = hasMatchingState && (state?.mobileMarketSource === "map" || state?.mobileMarketSource === "list")
          ? state.mobileMarketSource
          : "map";
        const returnSnap = state?.mobileReturnSnap;
        if (returnSnap === "collapsed" || returnSnap === "half" || returnSnap === "full") {
          previousSheetSnap.current = returnSnap;
        }
        selectedOrigin.current = { id: marketId, source };
        setSheetMode(view);
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
  }, [locale, restoreResultContext, today]);

  const marketListContent = isPending ? (
    <div className="list-loading" role="status"><span /><span /><span /><p>{ui.loadingMarkets}</p></div>
  ) : isError ? (
    <div className="empty-state">
      <h2>{ui.loadFailed}</h2>
      <p>{ui.tryAgainLater}</p>
      <button type="button" className="secondary-button" onClick={() => void refetch()}>{ui.retry}</button>
    </div>
  ) : (
    <MarketList
      markets={listedMarkets}
      inactiveMarkets={listedInactiveMarkets}
      range={range}
      onClearDate={query.trim() ? clearDateFilter : undefined}
      reviewedMarketIds={reviewedMarketIdSet}
      referenceDate={referenceDate}
      selectedId={selectedId}
      onSelect={selectListMarket}
      onReset={resetFilters}
      currentLocation={currentLocation}
      locale={locale}
      getMarketHref={(market) => locale === "en" || mode === "date"
        ? buildExplorerPath(locale, { query, mode, directDate, marketId: market.id })
        : getMarketBrowsePath(market, reviewedMarketIdSet.has(market.id))}
    />
  );

  const handleMapStatus = useCallback((status: "idle" | "loading" | "ready" | "error") => {
    setMapStatus(status);
  }, []);

  const focusSearchAfterLocationError = useCallback((message: string, permissionDenied: boolean) => {
    if (!permissionDenied) return;
    setIsSearchOpen(true);
    void message;
  }, []);

  return (
    <>
    <main className="explorer-shell" inert={isSearchOpen}>
      <MobileHomeControls
        locale={locale}
        languageSwitchHref={buildExplorerPath(locale === "en" ? "ko" : "en", { query, mode, directDate, marketId: selectedId })}
        mode={mode}
        query={query}
        directDate={dateReady ? directDate : ""}
        minDate={dateReady ? toIsoDate(today) : undefined}
        onMobileSearchOpen={() => setIsSearchOpen(true)}
        onModeChange={setMode}
        onQueryChange={setQuery}
        onDirectDateChange={handleDirectDateChange}
      />
      {locale === "en" ? <p className="english-map-note">Market names and addresses are in Korean. Dates use Korea time (KST). <a href="/en">How market days work</a></p> : null}
      {urlNotice ? <p className="english-map-note" role="status">{urlNotice}</p> : null}

      <div
        className={`explorer-grid ${selectedMarket ? "has-selection" : ""}`}
        ref={mobileResultsRef}
        data-mobile-view={sheetSnap === "full" ? "list" : "map"}
      >
        <div className="mobile-discovery-context">
          <p>{query ? ui.searchResultsHeading : ui.marketDiscoveryHeading} · {rangeLabel}</p>
          <h1>{query ? locale === "en" ? `Markets for “${query}”` : `“${query}” 시장 찾기` : ui.marketDiscoveryTitle}</h1>
          <small>{ui.marketDiscoveryHelp}</small>
          {reviewedGuides.length > 0 ? <a className="visit-guides-shortcut" href="#reviewed-market-guides-heading" onClick={(event) => {
            event.preventDefault();
            const heading = document.getElementById("reviewed-market-guides-heading");
            heading?.scrollIntoView({ block: "start" });
            heading?.focus({ preventScroll: true });
          }}>시장별 방문 정보</a> : null}
          <noscript><p>{locale === "en" ? "Enable JavaScript to use the map and date filters. Market guides remain available through the links below." : "지도와 날짜 검색은 자바스크립트가 필요합니다. 아래 시장별 방문 안내는 바로 읽을 수 있습니다."}</p></noscript>
          <div className="mobile-view-switch" role="group" aria-label={ui.resultViewLabel}>
            <button type="button" aria-pressed={sheetSnap !== "full"} onClick={() => setSheetSnap("collapsed")}>{ui.mapView}</button>
            <button type="button" aria-pressed={sheetSnap === "full"} onClick={() => setSheetSnap("full")}>{ui.listView}</button>
          </div>
        </div>
        <MarketMap
          locale={locale}
          markets={filteredMarkets}
          searchMarkets={queryMatches}
          searchQuery={query}
          referenceDate={referenceDate}
          selectedId={selectedId}
          clientId={mapClientId}
          onSelect={selectMapMarket}
          onLocationChange={setCurrentLocation}
          onCameraRestoreComplete={focusRestoredMapSelection}
          onStatusChange={handleMapStatus}
          onLocationError={focusSearchAfterLocationError}
          onFallbackList={() => setSheetSnap("full")}
        />

        <section className="mobile-market-results" aria-label={locale === "en" ? "Market results" : "시장 결과"} data-map-status={mapStatus}>
          {!isPending && !isError && dateReady ? <div className="mobile-results-heading">
            <h2>{locale === "en" ? `${filteredMarkets.length} markets for these dates` : `${mode === "date" ? "선택일에 장이 서는 시장" : "조건에 맞는 시장"} ${filteredMarkets.length}곳`}</h2>
            <span>{query ? locale === "en" ? `Search: “${query}”` : `“${query}” 검색` : locale === "en" ? `${displayedMarkets.length} results` : `시장 ${displayedMarkets.length}곳`}</span>
          </div> : null}
          {marketListContent}
          {reviewedGuides.length > 0 ? <ReviewedMarketGuides guides={reviewedGuides} /> : null}
        </section>
        <SiteFooter locale={locale} />

        {sheetMode === "detail" && selectedMarket ? (
          <MobileMarketSheet
            locale={locale}
            hasSelectedDate={mode === "date"}
            snap="full"
            onSnapChange={setSheetSnap}
            mode="detail"
            onModeChange={setSheetMode}
            title={locale === "en" ? `${selectedMarket.name} details` : `${selectedMarket.name} 상세`}
            describedBy="mobile-market-sheet-status"
            contentRef={mobileSheetContentRef}
            onClose={closeMarket}
          >
            <MarketDetail
              locale={locale}
              mobile
              market={selectedMarket}
              detailPath={reviewedMarketIdSet.has(selectedMarket.id) ? getMarketPagePath(selectedMarket) : undefined}
              sharePath={locale === "en" || mode === "date"
                ? buildExplorerPath(locale, { query, mode, directDate, marketId: selectedMarket.id })
                : getMarketBrowsePath(selectedMarket, reviewedMarketIdSet.has(selectedMarket.id))}
              today={today}
              selectedDate={mode === "date" ? range?.start : undefined}
              onVisitDateChange={handleDirectDateChange}
              onClearDate={clearDateFilter}
              onClose={closeMarket}
            />
          </MobileMarketSheet>
        ) : null}
      </div>

      {sheetMode === "results" ? (
        <nav className="mobile-primary-nav" aria-label={locale === "en" ? "Main views" : "주요 화면"}>
          <button type="button" aria-current={sheetSnap !== "full" ? "page" : undefined} onClick={() => setSheetSnap("collapsed")}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16" /></svg>{locale === "en" ? "Map" : "지도"}</button>
          <button type="button" aria-current={sheetSnap === "full" ? "page" : undefined} onClick={() => setSheetSnap("full")}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>{locale === "en" ? "List" : "목록"}</button>
          <button type="button" onClick={() => setIsSearchOpen(true)}><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>{locale === "en" ? "Search" : "검색"}</button>
        </nav>
      ) : null}

    </main>
    {isSearchOpen ? <MobileSearchScreen
      locale={locale}
      query={query}
      matches={queryMatches}
      today={today}
      range={range}
      onQueryChange={setQuery}
      onSelect={(market) => selectMarket(market, "list")}
      onShowResults={() => { setSheetSnap("full"); setIsSearchOpen(false); mobileResultsRef.current?.scrollTo(0, 0); }}
      onClose={() => { setIsSearchOpen(false); window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".mobile-search-launch")?.focus()); }}
    /> : null}
    </>
  );
}

export function MarketExplorer(props: MarketExplorerProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={queryClient}><MarketExplorerContent {...props} /></QueryClientProvider>;
}
