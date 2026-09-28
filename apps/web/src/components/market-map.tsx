"use client";

import { useEffect, useRef, useState } from "react";

import { buildMapItems, type CoordinateBounds } from "../lib/market-clusters";
import type { PublicMarket } from "../lib/market";
import { formatMarketTiming, type Coordinates } from "../lib/market-view";
import { loadNaverMaps, type NaverLatLng, type NaverMapInstance, type NaverMarker } from "../lib/naver-maps";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

interface MarketMapProps {
  locale?: Locale;
  markets: PublicMarket[];
  referenceDate: Date;
  selectedId: string | null;
  clientId: string;
  mobileOcclusion?: { top: number; bottom: number } | null;
  mobileSheetHeight?: number;
  onSelect: (market: PublicMarket) => void;
  onLocationChange: (location: Coordinates) => void;
  onCameraRestoreComplete?: (focusSelectedMarker: boolean) => void;
  onStatusChange?: (status: MapStatus) => void;
  onLocationError?: (message: string, permissionDenied: boolean) => void;
}

type MapStatus = "idle" | "loading" | "ready" | "error";
type LocationStatus = "idle" | "loading" | "success" | "error";
interface CameraSnapshot {
  center: NaverLatLng;
  zoom: number;
  shouldRestore: boolean;
}

const coordinateBounds = (map: NaverMapInstance): CoordinateBounds => {
  const bounds = map.getBounds();
  const northEast = bounds.getNE();
  const southWest = bounds.getSW();
  return {
    north: northEast.lat(),
    south: southWest.lat(),
    east: northEast.lng(),
    west: southWest.lng(),
  };
};

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
})[character] ?? character);

export function MarketMap({ locale = "ko", markets, referenceDate, selectedId, clientId, mobileOcclusion, mobileSheetHeight = 0, onSelect, onLocationChange, onCameraRestoreComplete, onStatusChange, onLocationError }: MarketMapProps) {
  const ui = getUiCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<Array<{ marker: NaverMarker; listener: unknown }>>([]);
  const locationMarkerRef = useRef<NaverMarker | null>(null);
  const [status, setStatus] = useState<MapStatus>(clientId ? "idle" : "error");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const lastSelectedIdRef = useRef<string | null>(null);
  const cameraSnapshotRef = useRef<CameraSnapshot | null>(null);
  const suppressZoomSnapshotRef = useRef(false);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    if (!clientId || !containerRef.current) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    loadNaverMaps(clientId)
      .then((naver) => {
        if (cancelled || !containerRef.current) return;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(36.35, 127.8),
          zoom: 7,
          minZoom: 6,
        });
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      locationMarkerRef.current?.setMap(null);
      locationMarkerRef.current = null;
      mapRef.current = null;
    };
  }, [clientId]);

  const moveToCurrentLocation = () => {
    if (status !== "ready" || !mapRef.current || !window.naver?.maps) return;
    if (cameraSnapshotRef.current) cameraSnapshotRef.current.shouldRestore = false;
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage(ui.locationUnavailable);
      return;
    }

    setLocationStatus("loading");
    setLocationMessage(ui.locating);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mapRef.current || !window.naver?.maps) return;
        const currentLocation = { latitude: coords.latitude, longitude: coords.longitude };
        const naver = window.naver;
        const position = new naver.maps.LatLng(currentLocation.latitude, currentLocation.longitude);
        locationMarkerRef.current?.setMap(null);
        locationMarkerRef.current = new naver.maps.Marker({
          map: mapRef.current,
          position,
          title: ui.currentLocation,
          zIndex: 30,
          icon: {
            content: `<span class="current-location-marker" aria-label="${escapeHtml(ui.currentLocation)}"><i></i></span>`,
            anchor: new naver.maps.Point(12, 12),
          },
        });
        mapRef.current.morph(position, 14);
        onLocationChange(currentLocation);
        setLocationStatus("success");
        setLocationMessage(ui.located);
      },
      (error) => {
        const permissionDenied = error.code === 1;
        const message = permissionDenied
          ? ui.locationDenied
          : ui.locationFailed;
        setLocationStatus("error");
        setLocationMessage(message);
        onLocationError?.(message, permissionDenied);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.naver?.maps) return;
    const naver = window.naver;
    const map = mapRef.current;

    const clearMarkers = () => {
      for (const item of markersRef.current) {
        naver.maps.Event.removeListener(item.listener);
        item.marker.setMap(null);
      }
      markersRef.current = [];
    };

    const renderMarkers = () => {
      clearMarkers();
      const zoom = map.getZoom();
      const items = buildMapItems(markets, zoom, coordinateBounds(map));
      markersRef.current = items.map((item) => {
        if (item.kind === "cluster") {
          const marker = new naver.maps.Marker({
            map,
            position: new naver.maps.LatLng(item.latitude, item.longitude),
            title: locale === "en" ? `${item.count} markets in this area` : `이 지역 시장 ${item.count}곳`,
            zIndex: 8,
            icon: {
              content: `<button class="map-cluster" type="button" aria-label="${locale === "en" ? `${item.count} markets in this area` : `이 지역 시장 ${item.count}곳`}"><strong>${item.count}</strong><small>${locale === "en" ? "" : "곳"}</small></button>`,
              anchor: new naver.maps.Point(23, 23),
            },
          });
          const listener = naver.maps.Event.addListener(marker, "click", () => {
            if (cameraSnapshotRef.current) cameraSnapshotRef.current.shouldRestore = false;
            map.panTo(new naver.maps.LatLng(item.latitude, item.longitude));
            map.setZoom(Math.min(map.getZoom() + 2, 13));
          });
          return { marker, listener };
        }

        const market = item.market;
        const selected = market.id === selectedId;
        const timing = formatMarketTiming(market, referenceDate, locale);
        const actionLabel = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 700px)").matches
          ? ui.mapPreview
          : ui.viewDetail;
        const marker = new naver.maps.Marker({
          map,
          position: new naver.maps.LatLng(market.latitude, market.longitude),
          title: `${market.name} · ${timing}`,
          zIndex: selected ? 20 : 10,
          icon: {
            content: `<button class="map-marker${selected ? " is-selected" : ""}" data-market-id="${escapeHtml(market.id)}" type="button" aria-label="${escapeHtml(market.name)} ${escapeHtml(actionLabel)}, ${escapeHtml(ui.scheduleLabel)} ${escapeHtml(timing)}"><span${locale === "en" ? ' lang="ko"' : ""}>${escapeHtml(market.name)}</span><strong>${escapeHtml(timing)}</strong></button>`,
            anchor: new naver.maps.Point(0, 38),
          },
        });
        const listener = naver.maps.Event.addListener(marker, "click", () => onSelect(market));
        return { marker, listener };
      });
    };

    renderMarkers();
    const idleListener = naver.maps.Event.addListener(map, "idle", renderMarkers);

    return () => {
      naver.maps.Event.removeListener(idleListener);
      clearMarkers();
    };
  }, [locale, markets, onSelect, referenceDate, selectedId, status, ui.mapPreview, ui.scheduleLabel, ui.viewDetail]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.naver?.maps || mobileOcclusion === undefined || mobileOcclusion === null) return;
    const map = mapRef.current;
    map.setOptions({
      padding: {
        top: mobileOcclusion.top + 12,
        right: 12,
        bottom: mobileOcclusion.bottom + 12,
        left: 12,
      },
    });
  }, [mobileOcclusion, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.naver?.maps) return;
    const naver = window.naver;
    const map = mapRef.current;
    const selected = markets.find((market) => market.id === selectedId);
    if (!selectedId || !selected) {
      const snapshot = cameraSnapshotRef.current;
      cameraSnapshotRef.current = null;
      if (!snapshot?.shouldRestore) {
        onCameraRestoreComplete?.(false);
        return;
      }
      const currentCenter = map.getCenter?.();
      if (currentCenter
        && map.getZoom() === snapshot.zoom
        && Math.abs(currentCenter.lat() - snapshot.center.lat()) < 0.0000001
        && Math.abs(currentCenter.lng() - snapshot.center.lng()) < 0.0000001) {
        onCameraRestoreComplete?.(true);
        return;
      }
      let finished = false;
      let idleListener: unknown;
      let fallbackTimer: number | null = null;
      let panRequested = false;
      const completeRestore = () => {
        if (finished) return;
        finished = true;
        if (idleListener !== undefined) naver.maps.Event.removeListener(idleListener);
        if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
        window.requestAnimationFrame(() => onCameraRestoreComplete?.(true));
      };
      map.setZoom(snapshot.zoom);
      idleListener = naver.maps.Event.addListener(map, "idle", () => {
        if (panRequested) completeRestore();
      });
      panRequested = true;
      map.panTo(snapshot.center);
      fallbackTimer = window.setTimeout(completeRestore, 800);
      return () => {
        finished = true;
        if (idleListener !== undefined) naver.maps.Event.removeListener(idleListener);
        if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      };
    }
    if (selected.latitude === null || selected.longitude === null) return;
    if (typeof map.getCenter !== "function") return;
    if (!cameraSnapshotRef.current) {
      cameraSnapshotRef.current = { center: map.getCenter(), zoom: map.getZoom(), shouldRestore: true };
    }
    const markMapAsUserMoved = () => {
      if (cameraSnapshotRef.current) cameraSnapshotRef.current.shouldRestore = false;
    };
    const markZoomAsUserChanged = () => {
      if (suppressZoomSnapshotRef.current) {
        suppressZoomSnapshotRef.current = false;
        return;
      }
      markMapAsUserMoved();
    };
    const dragListener = naver.maps.Event.addListener(map, "dragstart", markMapAsUserMoved);
    const zoomListener = naver.maps.Event.addListener(map, "zoom_changed", markZoomAsUserChanged);
    return () => {
      naver.maps.Event.removeListener(dragListener);
      naver.maps.Event.removeListener(zoomListener);
    };
  }, [markets, onCameraRestoreComplete, selectedId, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.naver?.maps) return;
    const naver = window.naver;
    const map = mapRef.current;
    const selected = markets.find((market) => market.id === selectedId);
    if (!selected || selected.latitude === null || selected.longitude === null) {
      lastSelectedIdRef.current = null;
      return;
    }
    const selectionChanged = lastSelectedIdRef.current !== selectedId;
    lastSelectedIdRef.current = selectedId;
    if (mobileOcclusion === null) return;

    const position = new naver.maps.LatLng(selected.latitude, selected.longitude);
    if (mobileOcclusion === undefined && mobileSheetHeight > 0) {
      if (selectionChanged) {
        if (map.getZoom() < 11) {
          suppressZoomSnapshotRef.current = true;
          map.setZoom(11);
          window.setTimeout(() => { suppressZoomSnapshotRef.current = false; }, 500);
        }
        map.panTo(position);
      }
      map.panBy(new naver.maps.Point(0, -mobileSheetHeight / 2));
      return;
    }
    if (mobileOcclusion === undefined) {
      if (selectionChanged) {
        if (map.getZoom() < 11) {
          suppressZoomSnapshotRef.current = true;
          map.setZoom(11);
          window.setTimeout(() => { suppressZoomSnapshotRef.current = false; }, 500);
        }
        map.panTo(position);
      }
      return;
    }
    if (selectionChanged && map.getZoom() < 11) {
      suppressZoomSnapshotRef.current = true;
      map.setZoom(11);
      window.setTimeout(() => { suppressZoomSnapshotRef.current = false; }, 500);
    }
    const container = containerRef.current;
    if (!container) return;

    let finished = false;
    let idleListener: unknown;
    const adjustSelectedMarker = () => {
      if (finished) return;
      const projection = map.getProjection();
      if (!projection) return;
      const point = projection.fromCoordToOffset(position);
      finished = true;
      if (idleListener !== undefined) naver.maps.Event.removeListener(idleListener);
      const { x, y } = point;
      const bounds = container.getBoundingClientRect();
      const top = mobileOcclusion.top + 24;
      const bottom = bounds.height - mobileOcclusion.bottom - 24;
      const left = 28;
      const right = bounds.width - 28;
      const visible = x >= left && x <= right && y >= top && y <= bottom;
      if (visible) return;
      const targetX = (left + right) / 2;
      const targetY = (top + bottom) / 2;
      map.panBy(new naver.maps.Point(targetX - x, targetY - y));
    };

    idleListener = naver.maps.Event.addListener(map, "idle", adjustSelectedMarker);
    if (selectionChanged) map.panTo(position);
    else adjustSelectedMarker();
    return () => {
      finished = true;
      if (idleListener !== undefined) naver.maps.Event.removeListener(idleListener);
    };
  }, [markets, mobileOcclusion, mobileSheetHeight, selectedId, status]);

  const showFallback = status === "error";

  return (
    <section className="map-stage" aria-label={ui.mapLabel}>
      <div className="map-canvas-shell">
        <div ref={containerRef} className="map-canvas" aria-hidden={showFallback} />
      </div>
      {status === "loading" ? (
        <div className="map-status" role="status">
          <span className="loading-ring" aria-hidden="true" />
          <strong>{ui.mapLoading}</strong>
        </div>
      ) : null}
      {showFallback ? (
        <div className="map-fallback" role="status">
          <div className="fallback-grid" aria-hidden="true" />
          <div className="fallback-message">
            <span className="fallback-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6" /></svg>
            </span>
            <strong>{ui.mapFallbackTitle}</strong>
            <p>{ui.mapFallbackBody}</p>
          </div>
        </div>
      ) : null}
      <div
        className="location-control"
        style={mobileOcclusion === null ? { display: "none" } : mobileOcclusion
          ? { top: `${mobileOcclusion.top + 10}px` }
          : undefined}
      >
        <button
          type="button"
          className="location-button"
          disabled={status !== "ready" || locationStatus === "loading"}
          onClick={moveToCurrentLocation}
          aria-label={locale === "en" ? "Move to current location" : "현재 위치로 이동"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></svg>
          <span>{locationStatus === "loading" ? locale === "en" ? "Locating" : "위치 확인 중" : ui.currentLocation}</span>
        </button>
        {locationMessage ? <p className={`location-message is-${locationStatus}`} role="status">{locationMessage}</p> : null}
      </div>
      <div className="map-legend" aria-hidden="true"><span /> {ui.mapLegend}</div>
    </section>
  );
}
