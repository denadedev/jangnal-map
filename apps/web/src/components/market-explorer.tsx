"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { SiteFooter } from "./site-footer";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import type { PublicMarket } from "../lib/market";
import type { MarketHighlight } from "../lib/market-highlight";
import { buildExplorerPath, type Locale } from "../lib/locale";
import { getMarketBrowsePath, getMarketPagePath } from "../lib/market-path";
import { filterMarkets, getDateRange, sortMarketsByDistance, type Coordinates } from "../lib/market-view";
import { getKoreaCalendarDate, msUntilNextKoreaMidnight } from "../lib/korea-date";
import { parseMarketSetLink, type MarketSetLink } from "../lib/market-set";
import { resolveRegionAlias } from "../lib/region-aliases";
import { getUiCopy } from "../lib/ui-copy";
import { MobileHomeControls } from "./mobile-home-controls";
import { MobileTabBar } from "./mobile-tab-bar";
import { MobileMarketSheet, type SheetMode, type SheetSnap } from "./mobile-market-sheet";
import { MobileSearchScreen } from "./mobile-search-screen";
import { MarketDetail } from "./market-detail";
import { findNearbyMarkets, MapParticipateButton, StoryListCard, type LatestStory } from "./today-highlight-prompt";
import { track } from "./market-highlights";
import type { DateFilterMode } from "./market-filters";
import { MarketList } from "./market-list";
import { MarketMap } from "./market-map";
import { Icon } from "./icon";
import { ReviewedMarketGuides, type ReviewedMarketGuide } from "./reviewed-market-guides";

export interface ExplorerInitialState {
  query?: string;
  mode?: DateFilterMode;
  selectedId?: string;
}

interface MarketExplorerProps {
  locale?: Locale;
  today?: Date;
  mapClientId?: string;
  initialState?: ExplorerInitialState;
  reviewedMarketIds?: string[];
  reviewedGuides?: ReviewedMarketGuide[];
  submissionsEnabled?: boolean;
}

const validModes = new Set<DateFilterMode>(["all", "today", "weekend"]);
const staticRenderDate = new Date(2000, 0, 15);

const readUrlState = (): ExplorerInitialState => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const modeValue = params.get("when") as DateFilterMode | null;
  return {
    query: params.get("q") ?? "",
    mode: modeValue && validModes.has(modeValue) ? modeValue : "today",
    selectedId: params.get("market") ?? undefined,
  };
};

async function fetchMarkets(): Promise<PublicMarket[]> {
  const response = await fetch("/api/markets");
  if (!response.ok) throw new Error("시장 데이터를 불러오지 못했습니다.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("시장 데이터 형식이 올바르지 않습니다.");
  return data as PublicMarket[];
}

// 승인된 방문자 제보 전부(최근 순). 실패해도 지도는 그대로 쓰도록 빈 목록으로 둔다.
async function fetchStories(): Promise<MarketHighlight[]> {
  const response = await fetch("/api/highlights");
  if (!response.ok) return [];
  const data = await response.json() as { highlights?: MarketHighlight[] };
  return Array.isArray(data.highlights) ? data.highlights : [];
}

const STORY_LIST_TITLES: Record<DateFilterMode, string> = { today: "오늘 서는 장 이야기", weekend: "이번 주말 장 이야기", all: "방문자 이야기" };

const emptyReviewedMarketIds: string[] = [];
const sheetSnaps: SheetSnap[] = ["collapsed", "half", "full"];
const nextSheetSnap = (snap: SheetSnap, direction: "up" | "down"): SheetSnap => {
  const index = sheetSnaps.indexOf(snap);
  return sheetSnaps[direction === "up" ? Math.min(index + 1, sheetSnaps.length - 1) : Math.max(index - 1, 0)];
};
type SelectionOrigin = { id: string; source: "map" | "list" };

function MarketExplorerContent({ locale = "ko", today: providedToday, mapClientId = "", initialState, reviewedMarketIds = emptyReviewedMarketIds, reviewedGuides = [], submissionsEnabled }: MarketExplorerProps) {
  const ui = getUiCopy(locale);
  const reviewedMarketIdSet = useMemo(() => new Set(reviewedMarketIds), [reviewedMarketIds]);
  const [today, setToday] = useState(() => providedToday ?? staticRenderDate);
  const resolvedInitial = useMemo(() => {
    const rawState = initialState ?? {};
    const mode = rawState.mode && validModes.has(rawState.mode) ? rawState.mode : "today";
    return { ...rawState, mode };
  }, [initialState]);
  const [query, setQuery] = useState(resolvedInitial.query ?? "");
  const [mode, setMode] = useState<DateFilterMode>(resolvedInitial.mode ?? "today");
  const [selectedId, setSelectedId] = useState<string | null>(resolvedInitial.selectedId ?? null);
  /** 지도의 "새 이야기"로 연 시장이면 그 이야기를 상세에서 강조한다. */
  const [storyFocus, setStoryFocus] = useState<{ marketId: string; name: string } | null>(null);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>(resolvedInitial.selectedId ? "full" : "collapsed");
  const [sheetMode, setSheetMode] = useState<SheetMode>(resolvedInitial.selectedId ? "detail" : "results");
  const previousSheetSnap = useRef<SheetSnap>("collapsed");
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
  const [marketSet, setMarketSet] = useState<MarketSetLink | null>(null);
  // 칩으로 묶음을 푼 직전 묶음. 잠깐 "다시 보기"를 띄워 실수로 누른 사람이 돌아갈 수 있게 한다.
  const [restorableSet, setRestorableSet] = useState<MarketSetLink | null>(null);
  const marketSetViewTrackedRef = useRef(false);
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

  const { data: stories = [] } = useQuery({
    queryKey: ["visitor-stories"],
    queryFn: fetchStories,
    enabled: locale === "ko",
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const storyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const story of stories) counts.set(story.marketId, (counts.get(story.marketId) ?? 0) + 1);
    return counts;
  }, [stories]);
  const storyMarketIds = useMemo(() => new Set(storyCounts.keys()), [storyCounts]);

  // 링크로 받은 시장 묶음. 한국어 지도에서, 검색어가 없을 때만 쓴다.
  const setMarkets = useMemo(() => marketSet
    ? marketSet.ids.map((id) => markets.find((market) => market.id === id)).filter((market): market is PublicMarket => Boolean(market))
    : [], [marketSet, markets]);
  const setActive = setMarkets.length > 0;
  const range = useMemo(() => setActive ? null : getDateRange(mode, today), [mode, setActive, today]);
  const referenceDate = range?.start ?? today;
  const marketSetPath = marketSet?.ids ?? null;
  const includeDaily = Boolean(query.trim()) || mode === "all";
  const regionPrefixes = locale === "en" ? resolveRegionAlias(query) : null;
  const queryMatches = useMemo(
    () => filterMarkets(markets, query, null, { regionPrefixes }),
    [markets, query, regionPrefixes],
  );
  const filteredMarkets = useMemo(
    () => setActive ? setMarkets : filterMarkets(markets, query, range, { includeDaily, regionPrefixes }),
    [includeDaily, markets, query, range, regionPrefixes, setActive, setMarkets],
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
  const filteredStories = useMemo(() => {
    const ids = new Set(filteredMarkets.map((market) => market.id));
    return stories.filter((story) => ids.has(story.marketId));
  }, [filteredMarkets, stories]);
  const dateReady = hasRestoredUrl || Boolean(providedToday);
  const setLabel = marketSet?.source === "threads" ? "스레드에서 본 시장" : "골라 둔 시장";
  const rangeLabel = !dateReady ? ui.today : setActive ? setLabel : range
    ? `${range.start.getMonth() + 1}/${range.start.getDate()}${range.start.getTime() === range.end.getTime() ? "" : `–${range.end.getMonth() + 1}/${range.end.getDate()}`}`
    : ui.allMarkets;
  const selectedMarket = markets.find((market) => market.id === selectedId) ?? null;
  const todayDigit = today.getDate() % 5 || 5;
  const todayPattern = `${todayDigit}·${todayDigit + 5}`;

  const focusResultControl = useCallback(() => {
    document.querySelector<HTMLButtonElement>(
      '.mobile-view-switch button[aria-pressed="true"]',
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
    const urlState = readUrlState();
    setQuery(urlState.query ?? "");
    setMode(urlState.mode ?? "today");
    setMarketSet(urlState.query || locale !== "ko" ? null : parseMarketSetLink(new URLSearchParams(window.location.search)));
    setSelectedId(urlState.selectedId ?? null);
    setSheetMode(urlState.selectedId ? "detail" : "results");
    setSheetSnap(urlState.selectedId ? "full" : "collapsed");
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
    const nextState = { ...(window.history.state ?? {}) } as Record<string, unknown>;
    if (selectedId) nextState.mobileMarket = selectedId;
    else {
      delete nextState.mobileMarket;
      delete nextState.mobileMarketView;
      delete nextState.mobileMarketSource;
      delete nextState.mobileMarketFromSearch;
      delete nextState.marketSelectionFromResults;
    }
    window.history.replaceState(nextState, "", buildExplorerPath(locale, { query, mode, marketId: selectedId, marketSet: marketSetPath }));
  }, [hasRestoredUrl, locale, marketSetPath, mode, query, selectedId]);

  // 링크의 시장이 하나도 없으면 평소 지도로. 있으면 링크로 들어온 화면을 한 번 센다.
  useEffect(() => {
    if (isPending || isError || !marketSet) return;
    if (setMarkets.length === 0) {
      setMarketSet(null);
      return;
    }
    if (marketSetViewTrackedRef.current) return;
    marketSetViewTrackedRef.current = true;
    track("market-set-view", { count: String(setMarkets.length), source: marketSet.source });
  }, [isError, isPending, marketSet, setMarkets.length]);

  const exitMarketSet = useCallback((via: "button" | "search" | "date") => {
    track("market-set-exit", { via });
    setRestorableSet(via === "button" ? marketSet : null);
    setMarketSet(null);
    setMode("today");
  }, [marketSet]);

  const restoreMarketSet = () => {
    if (!restorableSet) return;
    track("market-set-restore", { source: restorableSet.source });
    setMarketSet(restorableSet);
    setRestorableSet(null);
  };

  useEffect(() => {
    if (!restorableSet) return;
    const timer = window.setTimeout(() => setRestorableSet(null), 6_000);
    return () => window.clearTimeout(timer);
  }, [restorableSet]);

  // 검색하면 묶음을 풀고 전체 시장에서 찾는다.
  useEffect(() => {
    if (marketSet && query.trim()) exitMarketSet("search");
  }, [exitMarketSet, marketSet, query]);

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
    }, "", buildExplorerPath(locale, { query, mode, marketId: market.id, marketSet: marketSetPath }));
    if (setActive && marketSet) track("market-set-open", { market: market.id, source: marketSet.source });
    setStoryFocus(null);
    setSelectedId(market.id);
    setSheetMode(view);
    setSheetSnap("full");
    setIsSearchOpen(false);
  }, [isSearchOpen, locale, marketSet, marketSetPath, mode, query, selectedId, setActive, sheetMode, sheetSnap]);
  const selectMapMarket = useCallback((market: PublicMarket) => {
    if (storyMarketIds.has(market.id)) track("story_marker_open");
    selectMarket(market, "map");
  }, [selectMarket, storyMarketIds]);
  const selectListMarket = useCallback((market: PublicMarket) => selectMarket(market, "list"), [selectMarket]);
  const openLatestStory = useCallback(({ market, highlight }: LatestStory) => {
    selectMarket(market, "list");
    setStoryFocus({ marketId: market.id, name: highlight.name });
  }, [selectMarket]);
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
    setMode("today");
    closeMarket();
  };
  const clearDateFilter = () => setMode("all");
  const sheetDragStartY = useRef<number | null>(null);
  const sheetWasDragged = useRef(false);
  const handleSheetPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    sheetDragStartY.current = event.clientY;
    sheetWasDragged.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleSheetPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (sheetDragStartY.current === null) return;
    const delta = event.clientY - sheetDragStartY.current;
    sheetDragStartY.current = null;
    if (Math.abs(delta) < 36) return;
    sheetWasDragged.current = true;
    setSheetSnap((snap) => nextSheetSnap(snap, delta < 0 ? "up" : "down"));
  };
  const handleSheetHandleClick = () => {
    if (sheetWasDragged.current) {
      sheetWasDragged.current = false;
      return;
    }
    setSheetSnap((snap) => snap === "collapsed" ? "half" : snap === "half" ? "full" : "collapsed");
  };

  useEffect(() => {
    const handlePopState = () => {
      const urlState = readUrlState();
      if (!urlState.selectedId && returnToSearchRef.current) {
        setSelectedId(null);
        setSheetMode("results");
        setSheetSnap(previousSheetSnap.current);
        restoreResultContext();
        return;
      }
      setQuery(urlState.query ?? "");
      setMode(urlState.mode ?? "today");
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
      storyCounts={storyCounts}
      referenceDate={referenceDate}
      selectedId={selectedId}
      onSelect={selectListMarket}
      onReset={resetFilters}
      currentLocation={currentLocation}
      locale={locale}
      getMarketHref={(market) => locale === "en"
        ? buildExplorerPath(locale, { query, mode, marketId: market.id })
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
    <main className={`explorer-shell ${locale === "ko" ? "has-tab-bar" : ""}`} inert={isSearchOpen}>
      <MobileHomeControls
        locale={locale}
        languageSwitchHref={buildExplorerPath(locale === "en" ? "ko" : "en", { query, mode, marketId: selectedId })}
        mode={mode}
        query={query}
        onMobileSearchOpen={() => setIsSearchOpen(true)}
        onModeChange={(nextMode) => {
          if (marketSet) exitMarketSet("date");
          setMode(nextMode);
        }}
        onQueryChange={setQuery}
      />
      {locale === "en" ? <p className="english-map-note">Market names and addresses are in Korean. Dates use Korea time (KST). <a href="/en">How market days work</a></p> : null}
      {urlNotice ? <p className="english-map-note" role="status">{urlNotice}</p> : null}

      <div
        className={`explorer-grid ${selectedMarket ? "has-selection" : ""}`}
        data-mobile-view={sheetSnap === "full" ? "list" : "map"}
        data-sheet-snap={sheetSnap}
      >
        <MarketMap
          locale={locale}
          overlay={(submissionsEnabled || setActive || restorableSet) && locale === "ko" && dateReady && !isPending && !isError && !query.trim() && sheetSnap !== "full" && !selectedMarket
            ? <>
              {submissionsEnabled ? <MapParticipateButton
                markets={markets}
                today={today}
                currentLocation={currentLocation}
                suggested={setActive ? { markets: setMarkets, label: setLabel } : undefined}
                onOpenStory={setActive ? undefined : openLatestStory}
              /> : null}
              {setActive ? (
                <button type="button" className="market-set-chip" onClick={() => exitMarketSet("button")}>
                  <span><span>{setLabel} {setMarkets.length}곳만 보는 중</span><strong>전국 시장 모두 보기</strong></span>
                  <span className="market-set-chip-go" aria-hidden="true"><Icon name="close" /></span>
                </button>
              ) : restorableSet ? (
                <div className="market-set-toast" role="status">
                  <p>전체 시장을 보여 드려요</p>
                  <button type="button" onClick={restoreMarketSet}>
                    {restorableSet.source === "threads" ? "스레드 시장만 다시 보기" : "골라 둔 시장만 다시 보기"}
                  </button>
                </div>
              ) : null}
            </>
            : null}
          fitMarkets={setActive ? setMarkets : undefined}
          markets={filteredMarkets}
          storyMarketIds={storyMarketIds}
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

        <noscript><style>{".explorer-grid .results-sheet { height: calc(100% - 112px); } .explorer-grid .results-sheet-body { overflow-y: auto; }"}</style></noscript>
        <section className="results-sheet" aria-label={locale === "en" ? "Market list" : "시장 목록"}>
        <div className="results-sheet-header">
          <button
            type="button"
            className="results-sheet-handle"
            aria-label={ui.sheetHandle}
            aria-expanded={sheetSnap !== "collapsed"}
            onPointerDown={handleSheetPointerDown}
            onPointerUp={handleSheetPointerUp}
            onClick={handleSheetHandleClick}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp") setSheetSnap(nextSheetSnap(sheetSnap, "up"));
              else if (event.key === "ArrowDown") setSheetSnap(nextSheetSnap(sheetSnap, "down"));
            }}
          >
            <span className="results-sheet-grip" aria-hidden="true" />
          </button>
          <div className="results-sheet-summary">
            <p>
              <strong>{!isPending && !isError && dateReady ? locale === "en" ? `${displayedMarkets.length} markets` : `시장 ${displayedMarkets.length}곳` : query ? ui.searchResultsHeading : ui.marketDiscoveryHeading}</strong>
              <span>{rangeLabel}</span>
            </p>
            {dateReady && locale === "ko" ? <p className="today-jangnal"><b className="jn">{todayPattern}</b><span aria-hidden="true">오늘</span><span className="sr-only">{today.getMonth() + 1}월 {today.getDate()}일, 오늘은 {todayPattern}장이 서요</span></p> : null}
          </div>
          <div className="mobile-view-switch" role="group" aria-label={ui.resultViewLabel}>
            <button type="button" aria-pressed={sheetSnap !== "full"} onClick={() => setSheetSnap("collapsed")}>{ui.mapView}</button>
            <button type="button" aria-pressed={sheetSnap === "full"} onClick={() => setSheetSnap("full")}>{ui.listView}</button>
          </div>
        </div>
        <div className="results-sheet-body" ref={mobileResultsRef}>
        <div className="mobile-discovery-context">
          <h1>{query ? locale === "en" ? `Markets for “${query}”` : `“${query}” 시장 찾기` : ui.marketDiscoveryTitle}</h1>
          <small>{ui.marketDiscoveryHelp}</small>
          {reviewedGuides.length > 0 ? <a className="visit-guides-shortcut" href="#reviewed-market-guides-heading" onClick={(event) => {
            event.preventDefault();
            setSheetSnap("full");
            const heading = document.getElementById("reviewed-market-guides-heading");
            heading?.scrollIntoView({ block: "start" });
            heading?.focus({ preventScroll: true });
          }}>시장별 방문 정보</a> : null}
          <noscript><p>{locale === "en" ? "Enable JavaScript to use the map and date filters. Market guides remain available through the links below." : "지도와 날짜 검색은 자바스크립트가 필요합니다. 아래 시장별 방문 안내는 바로 읽을 수 있습니다."}</p></noscript>
        </div>
        {submissionsEnabled && locale === "ko" && dateReady && !isPending && !isError ? (
          query.trim() ? null : <StoryListCard
            markets={markets}
            today={today}
            currentLocation={currentLocation}
            stories={filteredStories}
            title={setActive ? "이 장들의 이야기" : STORY_LIST_TITLES[mode]}
            filter={setActive ? "set" : mode}
            onOpenStory={openLatestStory}
          />
        ) : null}

        <section className="mobile-market-results" aria-label={locale === "en" ? "Market results" : "시장 결과"} data-map-status={mapStatus}>
          {!isPending && !isError && dateReady ? <div className="mobile-results-heading">
            <h2>{locale === "en" ? `${filteredMarkets.length} markets for these dates` : `조건에 맞는 시장 ${filteredMarkets.length}곳`}</h2>
            <span>{query ? locale === "en" ? `Search: “${query}”` : `“${query}” 검색` : locale === "en" ? `${displayedMarkets.length} results` : `시장 ${displayedMarkets.length}곳`}</span>
          </div> : null}
          {marketListContent}
          {reviewedGuides.length > 0 ? <ReviewedMarketGuides guides={reviewedGuides} /> : null}
        </section>
        <SiteFooter locale={locale} />
        </div>
        </section>

        {sheetMode === "detail" && selectedMarket ? (
          <MobileMarketSheet
            locale={locale}
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
              sharePath={locale === "en"
                ? buildExplorerPath(locale, { query, mode, marketId: selectedMarket.id })
                : getMarketBrowsePath(selectedMarket, reviewedMarketIdSet.has(selectedMarket.id))}
              today={today}
              onClose={closeMarket}
              submissionsEnabled={submissionsEnabled}
              nearbyMarkets={findNearbyMarkets(selectedMarket, markets)}
              focusHighlight={storyFocus?.marketId === selectedMarket.id ? storyFocus.name : undefined}
            />
          </MobileMarketSheet>
        ) : null}
      </div>
      {locale === "ko" ? <MobileTabBar active="map" /> : null}
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
