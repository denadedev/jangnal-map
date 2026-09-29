"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Locale } from "../lib/locale";
import type { PublicMarket } from "../lib/market";

interface MarketDirectionsMenuProps {
  market: PublicMarket;
  locale?: Locale;
  className?: string;
  mobilePrimary?: boolean;
  label?: string;
}

export function MarketDirectionsMenu({ market, locale = "ko", className, mobilePrimary = false, label }: MarketDirectionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    setOpen(false);
    setCopyMessage("");
  }, [market.id]);

  if (market.latitude === null || market.longitude === null) return null;

  const naverUrl = `https://map.naver.com/p/directions/-/${market.longitude},${market.latitude},${encodeURIComponent(market.name)}/-/car`;
  const googleUrl = `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${market.latitude},${market.longitude}` })}`;
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(market.name)},${market.latitude},${market.longitude}`;
  const address = market.roadAddress ?? market.lotAddress;
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopyMessage(locale === "en" ? "Address copied" : "주소를 복사했어요");
      closeAfterSelection();
    } catch {
      setCopyMessage(locale === "en" ? "Could not copy the address" : "주소를 복사하지 못했어요");
    }
  };
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
        {label ?? (locale === "en" ? "Maps & directions" : "지도·길찾기")}
      </button>
      {open ? (
        <nav id={menuId} className="directions-menu-options" aria-label={locale === "en" ? "Choose a map service" : "지도 서비스 선택"}>
          <a href={naverUrl} target="_blank" rel="noreferrer" onClick={closeAfterSelection}>
            {locale === "en" ? "NAVER Maps — Directions" : "NAVER 지도 — 길찾기"}
          </a>
          {locale === "en" ? <a href={googleUrl} target="_blank" rel="noreferrer" onClick={closeAfterSelection}>Google Maps — View location</a> : <a href={kakaoUrl} target="_blank" rel="noreferrer" onClick={closeAfterSelection}>카카오맵 — 길찾기</a>}
          {locale === "ko" && address ? <button type="button" onClick={() => void copyAddress()}>주소 복사</button> : null}
        </nav>
      ) : null}
      {copyMessage ? <span className="directions-feedback" role="status">{copyMessage}</span> : null}
    </div>
  );
}
