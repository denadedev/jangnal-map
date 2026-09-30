"use client";

import { useEffect, useRef } from "react";

import type { Locale } from "../lib/locale";
import type { PublicMarket } from "../lib/market";
import { getUiCopy } from "../lib/ui-copy";
import { formatKoreanDate, formatMarketTiming, formatSchedulePattern } from "../lib/market-view";
import { getMarketDates, type DateRange } from "../lib/schedule";

interface MobileSearchScreenProps {
  locale: Locale;
  query: string;
  matches: PublicMarket[];
  today: Date;
  range: DateRange | null;
  onQueryChange: (query: string) => void;
  onSelect: (market: PublicMarket) => void;
  onShowResults: () => void;
  onClose: () => void;
}

export function MobileSearchScreen({ locale, query, matches, today, range, onQueryChange, onSelect, onShowResults, onClose }: MobileSearchScreenProps) {
  const ui = getUiCopy(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  const active = (market: PublicMarket) => !range || getMarketDates(market, range).length > 0;
  const dateMatches = matches.filter(active).length;
  const rangeLabel = range ? range.start.getTime() === range.end.getTime() ? formatKoreanDate(range.start, locale) : `${formatKoreanDate(range.start, locale)} – ${formatKoreanDate(range.end, locale)}` : locale === "en" ? "No date limit" : "날짜 제한 없음";
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
          <input ref={inputRef} type="search" aria-label={ui.searchLabel} placeholder={ui.searchPlaceholder} value={query} onChange={(event) => onQueryChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) onShowResults(); }} />
          {query ? <button type="button" aria-label={ui.clearSearch} onClick={() => { onQueryChange(""); inputRef.current?.focus(); }}>×</button> : null}
        </label>
      </div>
      <div className="mobile-search-content">
        <div className="mobile-search-intro">
          <h1>{locale === "en" ? "Which market are you looking for?" : "어느 시장을 찾으세요?"}</h1>
          <p>{locale === "en" ? "Search every market regardless of the date filter." : "날짜 조건과 상관없이 전체 시장에서 찾아드려요."}</p>
          {query.trim() ? <section className="mobile-search-date-summary" aria-label={locale === "en" ? "Search and date conditions" : "검색과 날짜 조건"}>
            <p>{locale === "en" ? "Search matches" : "검색 일치"}<strong aria-label={locale === "en" ? "Search match count" : "검색 일치 수"}>{matches.length}{locale === "en" ? " markets" : "곳"}</strong></p>
            <p>{locale === "en" ? "Selected dates" : "적용 날짜"}<strong>{rangeLabel}</strong></p>
            <p>{locale === "en" ? "Markets for these dates" : "이 날짜 조건에 장이 서는 시장"}<strong aria-label={locale === "en" ? "Date match count" : "날짜 조건에 맞는 시장 수"}>{dateMatches}{locale === "en" ? " markets" : "곳"}</strong></p>
          </section> : null}
        </div>
        <div className="mobile-search-suggestions">
          <h2>{query ? locale === "en" ? `${matches.length} results` : `검색 결과 ${matches.length}곳` : locale === "en" ? "Try a search" : "예시 검색"}</h2>
          {query ? (
            <>
              {matches.slice(0, 12).map((market) => {
                const timing = formatMarketTiming(market, range?.start ?? today, locale);
                const label = market.schedule.kind === "daily" ? locale === "en" ? "Daily" : "상설" : market.schedule.kind === "unknown" ? locale === "en" ? "Unconfirmed" : "미확인" : active(market) ? ui.marketDay : locale === "en" ? "Next" : "다음";
                const region = (market.roadAddress ?? market.lotAddress)?.split(" ").slice(0, 2).join(" · ") ?? ui.addressMissing;
                return <button type="button" key={market.id} className="mobile-search-result" aria-label={`${market.name}, ${timing} ${label}`} onClick={() => onSelect(market)}><span className="mobile-search-date-tile"><strong>{timing}</strong><small>{label}</small></span><span className="mobile-search-result-copy"><strong lang="ko">{market.name}</strong><small>{formatSchedulePattern(market, locale)}</small><small lang="ko">{region}</small></span><span aria-hidden="true">›</span></button>;
              })}
              {matches.length === 0 ? <p>{locale === "en" ? "No matching markets. Try another name or region." : "일치하는 시장이 없어요. 다른 이름이나 지역으로 검색해 보세요."}</p> : null}
              <button type="button" onClick={onShowResults}><span>{locale === "en" ? `View all results for “${query}”` : `“${query}” 전체 결과 보기`}</span><span aria-hidden="true">›</span></button>
            </>
          ) : suggestions.map((suggestion) => <button type="button" key={suggestion.query} onClick={() => { onQueryChange(suggestion.query); onShowResults(); }}><span>{suggestion.query}<small> · {suggestion.hint}</small></span><span aria-hidden="true">›</span></button>)}
        </div>
      </div>
    </section>
  );
}
