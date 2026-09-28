"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Locale } from "../lib/locale";
import type { PublicMarket } from "../lib/market";

interface MarketDirectionsMenuProps {
  market: PublicMarket;
  locale?: Locale;
  className?: string;
  mobilePrimary?: boolean;
}

export function MarketDirectionsMenu({ market, locale = "ko", className, mobilePrimary = false }: MarketDirectionsMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => setOpen(false), [market.id]);

  if (market.latitude === null || market.longitude === null) return null;

  const naverUrl = `https://map.naver.com/p/directions/-/${market.longitude},${market.latitude},${encodeURIComponent(market.name)}/-/car`;
  const googleUrl = `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${market.latitude},${market.longitude}` })}`;
  const closeAfterSelection = () => {
    triggerRef.current?.focus();
    setOpen(false);
  };

  return (
    <div
      className="directions-menu"
      onKeyDown={(event) => {
        if (!open || event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={className}
        data-mobile-primary-action={mobilePrimary ? "" : undefined}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {locale === "en" ? "Maps & directions" : "지도·길찾기"}
      </button>
      {open ? (
        <nav id={menuId} className="directions-menu-options" aria-label={locale === "en" ? "Choose a map service" : "지도 서비스 선택"}>
          <a href={naverUrl} target="_blank" rel="noreferrer" onClick={closeAfterSelection}>
            {locale === "en" ? "NAVER Maps — Directions" : "NAVER 지도 — 길찾기"}
          </a>
          <a href={googleUrl} target="_blank" rel="noreferrer" onClick={closeAfterSelection}>
            {locale === "en" ? "Google Maps — View location" : "Google 지도 — 위치 보기"}
          </a>
        </nav>
      ) : null}
    </div>
  );
}
