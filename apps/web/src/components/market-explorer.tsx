"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import type { PublicMarket } from "../lib/market";
import { buildExplorerPath, type Locale } from "../lib/locale";
import { getMarketBrowsePath, getMarketPagePath } from "../lib/market-path";
import { filterMarkets, getDateRange, normalizeDirectDate, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { getKoreaCalendarDate, msUntilNextKoreaMidnight } from "../lib/korea-date";
import { resolveRegionAlias } from "../lib/region-aliases";
import { getUiCopy } from "../lib/ui-copy";
import { MobileHomeControls } from "./mobile-home-controls";
import { MobileMarketSheet, type SheetMode, type SheetSnap } from "./mobile-market-sheet";
import { MarketDetail } from "./market-detail";
import { MarketPreview } from "./market-preview";
import type { DateFilterMode } from "./market-filters";
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
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>(resolvedInitial.selectedId ? "full" : "collapsed");
  const [sheetMode, setSheetMode] = useState<SheetMode>(resolvedInitial.selectedId ? "detail" : "results");
  const previousSheetSnap = useRef<SheetSnap>("collapsed");
  const selectedOrigin = useRef<SelectionOrigin | null>(null);
  const resultScrollTop = useRef(0);
  const mobileSheetContentRef = useRef<HTMLDivElement | null>(null);
  const mobileHomeControlsRef = useRef<HTMLDivElement | null>(null);
  const pendingMapFocusIdRef = useRef<string | null>(null);
  const mapFocusFallbackTimerRef = useRef<number | null>(null);
  const selectedIdRef = useRef(selectedId);
  const sheetModeRef = useRef(sheetMode);
  const searchFocusedRef = useRef(false);
  const keyboardExpandedRef = useRef(false);
  const sheetSnapBeforeKeyboardRef = useRef<SheetSnap>("collapsed");
  const sheetModeBeforeKeyboardRef = useRef<SheetMode>("results");
  const selectedIdBeforeKeyboardRef = useRef<string | null>(null);
  const viewportHeightAtSearchFocusRef = useRef(0);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [hasRestoredUrl, setHasRestoredUrl] = useState(false);
  const [urlNotice, setUrlNotice] = useState("");
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">(mapClientId ? "idle" : "error");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOcclusion, setMobileOcclusion] = useState({ top: 0, bottom: 0 });
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardBottomInset, setKeyboardBottomInset] = useState(0);
  useEffect(() => {
    selectedIdRef.current = selectedId;
    sheetModeRef.current = sheetMode;
  }, [selectedId, sheetMode]);
  const { data: markets = [], isPending, isError, refetch } = useQuery({
    queryKey: ["public-markets"],
    queryFn: fetchMarkets,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  const range = useMemo(() => getDateRange(mode, today, directDate), [directDate, mode, today]);
  const referenceDate = range?.start ?? today;
  const includeDaily = mode === "all" || mode === "date";
  const regionPrefixes = locale === "en" ? resolveRegionAlias(query) : null;
  const filteredMarkets = useMemo(
    () => filterMarkets(markets, query, range, { includeDaily, regionPrefixes }),
    [includeDaily, markets, query, range, regionPrefixes],
  );
  const listedMarkets = useMemo(
    () => currentLocation ? sortMarketsByDistance(filteredMarkets, currentLocation) : filteredMarkets,
    [currentLocation, filteredMarkets],
  );
  const mapMissingCount = filteredMarkets.filter((market) => market.latitude === null || market.longitude === null).length;
  const selectedMarket = markets.find((market) => market.id === selectedId) ?? null;

  const handleSearchFocus = useCallback(() => {
    searchFocusedRef.current = true;
    keyboardExpandedRef.current = false;
    sheetSnapBeforeKeyboardRef.current = sheetSnap;
    sheetModeBeforeKeyboardRef.current = sheetMode;
    selectedIdBeforeKeyboardRef.current = selectedId;
    viewportHeightAtSearchFocusRef.current = window.visualViewport?.height ?? window.innerHeight;
  }, [selectedId, sheetMode, sheetSnap]);

  const handleSearchBlur = useCallback(() => {
    window.setTimeout(() => {
      searchFocusedRef.current = false;
      if (keyboardExpandedRef.current
        && selectedIdRef.current === selectedIdBeforeKeyboardRef.current
        && sheetModeRef.current === "results") {
        setSheetSnap(sheetSnapBeforeKeyboardRef.current);
        setSheetMode(sheetModeBeforeKeyboardRef.current);
      }
      keyboardExpandedRef.current = false;
      setIsKeyboardOpen(false);
      setKeyboardBottomInset(0);
    }, 0);
  }, []);
  const handleDirectDateChange = useCallback((date: string) => {
    setDirectDate(toIsoDate(normalizeDirectDate(date, today)));
    setMode("date");
  }, [today]);

  const focusResultSheetControl = useCallback(() => {
    document.querySelector<HTMLButtonElement>(
      ".mobile-market-sheet-collapsed-button, .mobile-market-sheet-expand-button, .mobile-market-sheet-map-button",
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
        focusResultSheetControl();
        return;
      }
      const marker = Array.from(document.querySelectorAll<HTMLElement>(".map-marker[data-market-id]"))
        .find((element) => element.dataset.marketId === marketId && element.isConnected);
      if (marker) marker.focus();
      else focusResultSheetControl();
    });
  }, [focusResultSheetControl]);

  useEffect(() => {
    if (!isPending && selectedId && !filteredMarkets.some((market) => market.id === selectedId)) {
      if (locale === "en") {
        const message = "That market is not available with the current filters. Showing the market list instead.";
        setUrlNotice((current) => current.includes(message) ? current : [current, message].filter(Boolean).join(" "));
      }
      setSelectedId(null);
      setSheetMode("results");
      setSheetSnap("collapsed");
      selectedOrigin.current = null;
    }
  }, [filteredMarkets, hasRestoredUrl, isPending, locale, selectedId]);

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
    }
    window.history.replaceState(nextState, "", buildExplorerPath(locale, { query, mode, directDate, marketId: selectedId }));
  }, [directDate, hasRestoredUrl, locale, mode, query, selectedId]);

  const restoreResultContext = useCallback(() => {
    const origin = selectedOrigin.current;
    if (origin?.source === "map" && mapStatus === "ready") {
      pendingMapFocusIdRef.current = origin.id;
      if (mapFocusFallbackTimerRef.current !== null) window.clearTimeout(mapFocusFallbackTimerRef.current);
      mapFocusFallbackTimerRef.current = window.setTimeout(() => {
        if (pendingMapFocusIdRef.current !== origin.id) return;
        pendingMapFocusIdRef.current = null;
        mapFocusFallbackTimerRef.current = null;
        focusResultSheetControl();
      }, 1_000);
    }
    window.requestAnimationFrame(() => {
      if (mobileSheetContentRef.current) mobileSheetContentRef.current.scrollTop = resultScrollTop.current;
      if (!(origin?.source === "map" && mapStatus === "ready")) {
        if (origin?.source === "map" || !origin) {
          focusResultSheetControl();
        } else {
          const originItem = Array.from(document.querySelectorAll<HTMLElement>(".mobile-market-sheet [data-market-id]"))
            .find((element) => element.dataset.marketId === origin.id);
          originItem?.focus();
        }
      }
      selectedOrigin.current = null;
    });
  }, [focusResultSheetControl, mapStatus]);

  const selectMarket = useCallback((market: PublicMarket, source: "map" | "list") => {
    pendingMapFocusIdRef.current = null;
    if (mapFocusFallbackTimerRef.current !== null) {
      window.clearTimeout(mapFocusFallbackTimerRef.current);
      mapFocusFallbackTimerRef.current = null;
    }
    const returnSnap = sheetMode === "results" ? sheetSnap : previousSheetSnap.current;
    previousSheetSnap.current = returnSnap;
    selectedOrigin.current = { id: market.id, source };
    resultScrollTop.current = mobileSheetContentRef.current?.scrollTop ?? 0;
    const view = source === "map" && window.matchMedia?.("(max-width: 700px)").matches ? "preview" : "detail";
    window.history.pushState({
      ...(window.history.state ?? {}),
      mobileMarket: market.id,
      mobileMarketView: view,
      mobileMarketSource: source,
      mobileReturnSnap: returnSnap,
    }, "", buildExplorerPath(locale, { query, mode, directDate, marketId: market.id }));
    setSelectedId(market.id);
    setSheetMode(view);
    setSheetSnap(view === "preview" ? "collapsed" : "full");
  }, [directDate, locale, mode, query, sheetMode, sheetSnap]);
  const selectMapMarket = useCallback((market: PublicMarket) => selectMarket(market, "map"), [selectMarket]);
  const selectListMarket = useCallback((market: PublicMarket) => selectMarket(market, "list"), [selectMarket]);
  const closeMarket = useCallback(() => {
    const selected = selectedOrigin.current;
    if (selected && window.history.state?.mobileMarket === selected.id) {
      window.history.back();
      return;
    }
    setSelectedId(null);
    setSheetMode("results");
    setSheetSnap(previousSheetSnap.current);
    restoreResultContext();
  }, [restoreResultContext]);
  const closeMarketToList = useCallback(() => {
    previousSheetSnap.current = "full";
    if (selectedOrigin.current) selectedOrigin.current = { ...selectedOrigin.current, source: "list" };
    closeMarket();
  }, [closeMarket]);
  const openSelectedMarketDetail = useCallback(() => {
    if (!selectedId) return;
    const nextState = {
      ...(window.history.state ?? {}),
      mobileMarket: selectedId,
      mobileMarketView: "detail",
    };
    window.history.replaceState(nextState, "");
    setSheetMode("detail");
    setSheetSnap("full");
  }, [selectedId]);
  const resetFilters = () => {
    setUrlNotice("");
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
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateKeyboardState = () => {
      const keyboardOpen = searchFocusedRef.current
        && viewportHeightAtSearchFocusRef.current - viewport.height > 120;
      const bottomInset = keyboardOpen
        ? Math.max(0, Math.round(window.innerHeight - viewport.offsetTop - viewport.height))
        : 0;
      setKeyboardBottomInset((current) => current === bottomInset ? current : bottomInset);
      if (keyboardOpen && !keyboardExpandedRef.current) {
        keyboardExpandedRef.current = true;
        setIsKeyboardOpen(true);
        if (sheetModeRef.current === "preview") setSheetMode("results");
        if (sheetModeRef.current === "results" || sheetModeRef.current === "preview") setSheetSnap("full");
      } else if (!keyboardOpen && keyboardExpandedRef.current) {
        keyboardExpandedRef.current = false;
        setIsKeyboardOpen(false);
        if (searchFocusedRef.current
          && selectedIdRef.current === selectedIdBeforeKeyboardRef.current
          && sheetModeRef.current === "results") {
          setSheetSnap(sheetSnapBeforeKeyboardRef.current);
          setSheetMode(sheetModeBeforeKeyboardRef.current);
        }
      }
    };
    viewport.addEventListener("resize", updateKeyboardState);
    return () => viewport.removeEventListener("resize", updateKeyboardState);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const toolbar = mobileHomeControlsRef.current;
    const map = document.querySelector<HTMLElement>(".map-stage");
    const sheet = document.querySelector<HTMLElement>(".mobile-market-sheet");
    if (!toolbar || !map || !sheet) return;

    const updateOcclusion = () => {
      const toolbarRect = toolbar.getBoundingClientRect();
      const mapRect = map.getBoundingClientRect();
      const sheetRect = sheet.getBoundingClientRect();
      const roundUpToEight = (value: number) => Math.ceil(value / 8) * 8;
      const top = Math.max(0, Math.min(mapRect.height, roundUpToEight(toolbarRect.bottom - mapRect.top)));
      const bottom = Math.max(0, Math.min(mapRect.height, roundUpToEight(mapRect.bottom - sheetRect.top)));
      setMobileOcclusion((current) => current.top === top && current.bottom === bottom ? current : { top, bottom });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOcclusion);
    observer?.observe(toolbar);
    observer?.observe(map);
    observer?.observe(sheet);
    window.addEventListener("resize", updateOcclusion);
    window.visualViewport?.addEventListener("resize", updateOcclusion);
    updateOcclusion();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateOcclusion);
      window.visualViewport?.removeEventListener("resize", updateOcclusion);
    };
  }, [isMobile]);

  useEffect(() => {
    const handlePopState = () => {
      const urlState = readUrlState(today);
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
        const view = hasMatchingState && state?.mobileMarketView === "preview" ? "preview" : "detail";
        const source = hasMatchingState && (state?.mobileMarketSource === "map" || state?.mobileMarketSource === "list")
          ? state.mobileMarketSource
          : "map";
        const returnSnap = state?.mobileReturnSnap;
        if (returnSnap === "collapsed" || returnSnap === "half" || returnSnap === "full") {
          previousSheetSnap.current = returnSnap;
        }
        selectedOrigin.current = { id: marketId, source };
        setSheetMode(view);
        setSheetSnap(view === "preview" ? "collapsed" : "full");
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

  const listHeading = (
    <div className="list-heading">
      <div>
        <p>{mode === "all" ? ui.allMarketHeading : mode === "date" ? ui.selectedDateHeading : ui.marketDayHeading}</p>
        <strong>{locale === "en" ? `${filteredMarkets.length} markets` : `${filteredMarkets.length}곳`}</strong>
        {mapMissingCount > 0 ? <small>{locale === "en" ? `${mapMissingCount} not shown on map` : `지도 미표시 ${mapMissingCount}곳`}</small> : null}
      </div>
      <span>{query ? locale === "en" ? `Search: “${query}”` : `“${query}” 검색` : ui.nationwide}</span>
    </div>
  );

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
      reviewedMarketIds={reviewedMarketIdSet}
      referenceDate={referenceDate}
      selectedId={selectedId}
      onSelect={selectListMarket}
      onReset={resetFilters}
      currentLocation={currentLocation}
      locale={locale}
      getMarketHref={(market) => locale === "en"
        ? buildExplorerPath("en", { query, mode, directDate, marketId: market.id })
        : getMarketBrowsePath(market, reviewedMarketIdSet.has(market.id))}
    />
  );

  const handleMapStatus = useCallback((status: "idle" | "loading" | "ready" | "error") => {
    setMapStatus(status);
    if (status === "error") {
      previousSheetSnap.current = "full";
      setSheetMode(selectedId ? "detail" : "results");
      setSheetSnap("full");
    }
  }, [selectedId]);

  const focusSearchAfterLocationError = useCallback((message: string, permissionDenied: boolean) => {
    if (!permissionDenied) return;
    window.setTimeout(() => document.querySelector<HTMLInputElement>('.search-field input[type="search"]')?.focus(), 0);
    void message;
  }, []);

  return (
    <main className="explorer-shell">
      <MobileHomeControls
        locale={locale}
        languageSwitchHref={buildExplorerPath(locale === "en" ? "ko" : "en", { query, mode, directDate, marketId: selectedId })}
        containerRef={mobileHomeControlsRef}
        mode={mode}
        query={query}
        directDate={directDate}
        minDate={toIsoDate(today)}
        onModeChange={setMode}
        onQueryChange={setQuery}
        onSearchFocus={handleSearchFocus}
        onSearchBlur={handleSearchBlur}
        onDirectDateChange={handleDirectDateChange}
      />
      <header className="app-header">
        <a className="brand" href={locale === "en" ? "/en" : "/"} aria-label={ui.homeLabel}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><h1>{ui.brand}</h1><small>{ui.tagline}</small></span>
        </a>
        <div className="header-actions">
          <div className="data-badge"><span aria-hidden="true" /> {locale === "en" ? "Markets in Korea" : "전국 시장"} {isPending ? "…" : locale === "en" ? markets.length.toLocaleString("en-US") : `${markets.length.toLocaleString("ko-KR")}곳`}</div>
          {locale === "en" ? <a className="feedback-link" href="/en">Guide</a> : null}
          <a className="feedback-link" href="/onnuri">{ui.onnuri}</a>
          <a className="feedback-link" href="/report?kind=service">{ui.report}</a>
          <a className="feedback-link" href={buildExplorerPath(locale === "en" ? "ko" : "en", { query, mode, directDate, marketId: selectedId })}>{locale === "en" ? "한국어" : "English"}</a>
        </div>
      </header>

      {locale === "en" ? <p className="english-map-note">Market names and addresses are in Korean. Dates use Korea time (KST). <a href="/en">How market days work</a></p> : null}
      {urlNotice ? <p className="english-map-note" role="status">{urlNotice}</p> : null}

      {reviewedGuides.length > 0 ? (
        <div className="desktop-reviewed-market-guides">
          <ReviewedMarketGuides guides={reviewedGuides} />
        </div>
      ) : null}

      <div
        className={`explorer-grid ${selectedMarket ? "has-selection" : ""}`}
        data-keyboard-open={isKeyboardOpen ? "true" : "false"}
        style={{
          "--mobile-sheet-top": `${mobileOcclusion.top + 8}px`,
          "--mobile-keyboard-bottom": `${keyboardBottomInset}px`,
        } as CSSProperties}
      >
        <aside className="list-pane" aria-label={ui.listLabel}>
          {listHeading}
          {marketListContent}
        </aside>

        <MarketMap
          locale={locale}
          markets={filteredMarkets}
          referenceDate={referenceDate}
          selectedId={selectedId}
          clientId={mapClientId}
          mobileOcclusion={isMobile
            ? sheetMode === "detail" || sheetSnap === "full" ? null : mobileOcclusion
            : undefined}
          onSelect={selectMapMarket}
          onLocationChange={setCurrentLocation}
          onCameraRestoreComplete={focusRestoredMapSelection}
          onStatusChange={handleMapStatus}
          onLocationError={focusSearchAfterLocationError}
        />

        <aside className="detail-pane" aria-live="polite">
          <MarketDetail
            locale={locale}
            market={selectedMarket}
            detailPath={selectedMarket && reviewedMarketIdSet.has(selectedMarket.id) ? getMarketPagePath(selectedMarket) : undefined}
            sharePath={selectedMarket ? locale === "en"
              ? buildExplorerPath("en", { query, mode, directDate, marketId: selectedMarket.id })
              : getMarketBrowsePath(selectedMarket, reviewedMarketIdSet.has(selectedMarket.id)) : undefined}
            today={today}
            selectedDate={locale === "en" && mode === "date" ? range?.start : undefined}
            onClose={closeMarket}
          />
        </aside>

        {isMobile ? (
          <MobileMarketSheet
            locale={locale}
            hasSelectedDate={locale === "en" && mode === "date"}
            snap={sheetSnap}
            onSnapChange={setSheetSnap}
            mode={sheetMode}
            onModeChange={setSheetMode}
            title={sheetMode !== "results" && selectedMarket
              ? sheetMode === "preview" ? locale === "en" ? `${selectedMarket.name} preview` : `${selectedMarket.name} 미리보기` : locale === "en" ? `${selectedMarket.name} details` : `${selectedMarket.name} 상세`
              : locale === "en" ? `${filteredMarkets.length} market results` : `${filteredMarkets.length}곳 시장 결과`}
            describedBy="mobile-market-sheet-status"
            contentRef={mobileSheetContentRef}
            onClose={closeMarket}
            onListView={closeMarketToList}
            onPreviewOpenDetail={openSelectedMarketDetail}
          >
            {reviewedGuides.length > 0 && sheetMode === "results" ? (
              <ReviewedMarketGuides guides={reviewedGuides} />
            ) : null}
            {sheetMode === "detail" ? (
              <MarketDetail
                locale={locale}
                market={selectedMarket}
                detailPath={selectedMarket && reviewedMarketIdSet.has(selectedMarket.id) ? getMarketPagePath(selectedMarket) : undefined}
                sharePath={selectedMarket ? locale === "en"
                  ? buildExplorerPath("en", { query, mode, directDate, marketId: selectedMarket.id })
                  : getMarketBrowsePath(selectedMarket, reviewedMarketIdSet.has(selectedMarket.id)) : undefined}
                today={today}
                selectedDate={locale === "en" && mode === "date" ? range?.start : undefined}
                onClose={closeMarket}
              />
            ) : sheetMode === "preview" && selectedMarket ? (
              <MarketPreview
                locale={locale}
                market={selectedMarket}
                today={today}
                selectedDate={locale === "en" && mode === "date" ? range?.start : undefined}
                onOpenDetail={openSelectedMarketDetail}
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

      <div className="home-site-footer"><SiteFooter locale={locale} /></div>

    </main>
  );
}

export function MarketExplorer(props: MarketExplorerProps) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={queryClient}><MarketExplorerContent {...props} /></QueryClientProvider>;
}
