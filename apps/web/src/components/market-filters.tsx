"use client";

import { useRef } from "react";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";
import type { ReactNode } from "react";

export type DateFilterMode = "all" | "today" | "week" | "weekend" | "date";

export interface MarketFiltersProps {
  locale?: Locale;
  mode: DateFilterMode;
  query: string;
  directDate: string;
  minDate?: string;
  onModeChange: (mode: DateFilterMode) => void;
  onQueryChange: (query: string) => void;
  onDirectDateChange: (date: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  mobileMenuControl?: ReactNode;
}

export function MarketFilters(_props: MarketFiltersProps) {
  const { locale = "ko", mode, query, directDate, minDate, onModeChange, onQueryChange, onDirectDateChange, onSearchFocus, onSearchBlur, mobileMenuControl } = _props;
  const ui = getUiCopy(locale);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const modes: Array<{ value: DateFilterMode; label: string }> = [
    { value: "week", label: ui.week },
    { value: "today", label: ui.today },
    { value: "weekend", label: ui.weekend },
    { value: "date", label: ui.chooseDate },
    { value: "all", label: ui.allMarkets },
  ];
  const selectMode = (nextMode: DateFilterMode) => {
    onModeChange(nextMode);
    if (nextMode !== "date") return;
    const input = dateInputRef.current;
    if (!input) return;
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
    if (!input.showPicker) input.focus();
  };

  return (
    <section className="market-filters" aria-label={ui.filterLabel}>
      <div className="market-filter-search-row">
        <a className="mobile-home-brand" href={locale === "en" ? "/en" : "/"} aria-label={ui.homeLabel}>
          <span className="mobile-app-bar-mark" aria-hidden="true">{locale === "en" ? "K" : "장"}</span>
        </a>
        <label className="search-field">
          <span className="sr-only">{ui.searchLabel}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
          </svg>
          <input
            type="search"
            aria-label={ui.searchLabel}
            value={query}
            placeholder={ui.searchPlaceholder}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
          />
          {query ? (
            <button type="button" className="search-clear" aria-label={ui.clearSearch} onClick={() => onQueryChange("")}>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </button>
          ) : null}
        </label>
        {mobileMenuControl}
      </div>

      <div className="date-filter-row" aria-label={ui.dateRange}>
        <div className="filter-pills">
          {modes.map((item) => (
            <button
              key={item.value}
              type="button"
              className="filter-pill"
              aria-pressed={mode === item.value}
              onClick={() => selectMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className={`direct-date ${mode === "date" ? "is-visible" : ""}`}>
          <span>{ui.date}</span>
          <input
            ref={dateInputRef}
            type="date"
            value={directDate}
            min={minDate}
            onChange={(event) => onDirectDateChange(event.target.value)}
            onFocus={() => onModeChange("date")}
          />
        </label>
      </div>
    </section>
  );
}
