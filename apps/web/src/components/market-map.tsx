"use client";

import { useEffect, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { formatPinDate } from "../lib/market-view";
import { loadNaverMaps, type NaverMapInstance, type NaverMarker } from "../lib/naver-maps";

interface MarketMapProps {
  markets: PublicMarket[];
  referenceDate: Date;
  selectedId: string | null;
  clientId: string;
  onSelect: (market: PublicMarket) => void;
}

type MapStatus = "idle" | "loading" | "ready" | "error";

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
})[character] ?? character);

export function MarketMap({ markets, referenceDate, selectedId, clientId, onSelect }: MarketMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markersRef = useRef<Array<{ marker: NaverMarker; listener: unknown }>>([]);
  const [status, setStatus] = useState<MapStatus>(clientId ? "idle" : "error");

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
      mapRef.current = null;
    };
  }, [clientId]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !window.naver?.maps) return;
    const naver = window.naver;

    for (const item of markersRef.current) {
      naver.maps.Event.removeListener(item.listener);
      item.marker.setMap(null);
    }

    markersRef.current = markets.map((market) => {
      const selected = market.id === selectedId;
      const marker = new naver.maps.Marker({
        map: mapRef.current as NaverMapInstance,
        position: new naver.maps.LatLng(market.latitude, market.longitude),
        title: `${market.name} · ${formatPinDate(market, referenceDate)}`,
        zIndex: selected ? 20 : 10,
        icon: {
          content: `<button class="map-marker${selected ? " is-selected" : ""}" type="button" aria-label="${escapeHtml(market.name)} 상세 보기, 다음 장날 ${formatPinDate(market, referenceDate)}"><span>${escapeHtml(market.name)}</span><strong>${formatPinDate(market, referenceDate)}</strong></button>`,
          anchor: new naver.maps.Point(0, 38),
        },
      });
      const listener = naver.maps.Event.addListener(marker, "click", () => onSelect(market));
      return { marker, listener };
    });

    const selected = markets.find((market) => market.id === selectedId);
    if (selected) mapRef.current.panTo(new naver.maps.LatLng(selected.latitude, selected.longitude));

    return () => {
      for (const item of markersRef.current) {
        naver.maps.Event.removeListener(item.listener);
        item.marker.setMap(null);
      }
      markersRef.current = [];
    };
  }, [markets, onSelect, referenceDate, selectedId, status]);

  const showFallback = status === "error";

  return (
    <section className="map-stage" aria-label="전국 전통시장 지도">
      <div ref={containerRef} className="map-canvas" aria-hidden={showFallback} />
      {status === "loading" ? (
        <div className="map-status" role="status">
          <span className="loading-ring" aria-hidden="true" />
          <strong>전국 장날 지도를 펼치는 중</strong>
        </div>
      ) : null}
      {showFallback ? (
        <div className="map-fallback" role="status">
          <div className="fallback-grid" aria-hidden="true" />
          <div className="fallback-message">
            <span className="fallback-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6" /></svg>
            </span>
            <strong>지도 없이도 시장을 찾을 수 있어요</strong>
            <p>지도 연결을 확인하는 동안 왼쪽 목록에서 시장과 장날을 모두 탐색할 수 있습니다.</p>
          </div>
        </div>
      ) : null}
      <div className="map-legend" aria-hidden="true"><span /> 시장명 · 다음 장날</div>
    </section>
  );
}
