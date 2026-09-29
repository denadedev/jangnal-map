"use client";

import { useEffect, useRef } from "react";

import type { Locale } from "../lib/locale";
import type { PublicMarket } from "../lib/market";
import { getUiCopy } from "../lib/ui-copy";

interface MobileSearchScreenProps {
  locale: Locale;
  query: string;
  matches: PublicMarket[];
  onQueryChange: (query: string) => void;
  onSelect: (market: PublicMarket) => void;
  onShowResults: () => void;
  onClose: () => void;
}

export function MobileSearchScreen({ locale, query, matches, onQueryChange, onSelect, onShowResults, onClose }: MobileSearchScreenProps) {
  const ui = getUiCopy(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const suggestions = locale === "en"
    ? [{ query: "Seoul", hint: "Region" }, { query: "Pyeongtaek", hint: "Region" }, { query: "통복시장", hint: "Market" }]
    : [{ query: "망원시장", hint: "상설시장" }, { query: "평택", hint: "지역 검색" }, { query: "통복시장", hint: "5일장" }];

  return (
    <section className="mobile-search-screen" role="dialog" aria-modal="true" aria-label={locale === "en" ? "Market search" : "시장 검색"} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])"));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className="mobile-search-header">
        <button type="button" className="mobile-search-back" aria-label={locale === "en" ? "Back" : "뒤로"} onClick={onClose}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <label className="mobile-search-input">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
          <input ref={inputRef} type="search" aria-label={ui.searchLabel} placeholder={ui.searchPlaceholder} value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onShowResults(); }} />
          {query ? <button type="button" aria-label={ui.clearSearch} onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}>×</button> : null}
        </label>
      </div>
      <div className="mobile-search-content">
        <div className="mobile-search-intro">
          <h1>{locale === "en" ? "Which market are you looking for?" : "어느 시장을 찾으세요?"}</h1>
          <p>{locale === "en" ? "Search every market regardless of the date filter." : "날짜 필터와 관계없이 전체 시장에서 검색합니다."}</p>
        </div>
        <div className="mobile-search-suggestions">
          <h2>{query ? locale === "en" ? `${matches.length} results` : `검색 결과 ${matches.length}곳` : locale === "en" ? "Try a search" : "예시 검색"}</h2>
          {query ? (
            <>
              {matches.slice(0, 12).map((market) => <button type="button" key={market.id} onClick={() => onSelect(market)}><span><strong lang="ko">{market.name}</strong><small lang="ko">{market.roadAddress ?? market.lotAddress ?? ""}</small></span><span aria-hidden="true">›</span></button>)}
              {matches.length === 0 ? <p>{locale === "en" ? "No matching markets. Try another name or region." : "일치하는 시장이 없어요. 다른 이름이나 지역으로 검색해 보세요."}</p> : null}
              <button type="button" onClick={onShowResults}><span>{locale === "en" ? `View all results for “${query}”` : `“${query}” 전체 결과 보기`}</span><span aria-hidden="true">›</span></button>
            </>
          ) : suggestions.map((suggestion) => <button type="button" key={suggestion.query} onClick={() => { onQueryChange(suggestion.query); onShowResults(); }}><span>{suggestion.query}<small> · {suggestion.hint}</small></span><span aria-hidden="true">›</span></button>)}
        </div>
      </div>
    </section>
  );
}
