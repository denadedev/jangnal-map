"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";
import type { ReactNode } from "react";
import { BrandMark, Icon } from "./icon";

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
  onMobileSearchOpen?: () => void;
  mobileMenuControl?: ReactNode;
}

export function MarketFilters(_props: MarketFiltersProps) {
  const { locale = "ko", mode, query, directDate, minDate, onModeChange, onQueryChange, onDirectDateChange, onMobileSearchOpen, mobileMenuControl } = _props;
  const ui = getUiCopy(locale);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const selectedChipRef = useRef<HTMLButtonElement>(null);
  const [showDateFallback, setShowDateFallback] = useState(false);
  useEffect(() => {
    if (!window.matchMedia?.("(max-width: 700px)").matches) return;
    const chip = selectedChipRef.current;
    const strip = chip?.parentElement;
    if (!chip || !strip) return;
    const chipRect = chip.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    if (chipRect.right > stripRect.right) strip.scrollLeft += chipRect.right - stripRect.right;
    else if (chipRect.left < stripRect.left) strip.scrollLeft -= stripRect.left - chipRect.left;
  }, [mode]);
  const chosenDate = new Date(`${directDate}T00:00:00`);
  const dateChipLabel = mode === "date" && !Number.isNaN(chosenDate.getTime())
    ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(chosenDate)
    : ui.chooseDate;
  const modes: Array<{ value: DateFilterMode; label: string }> = [
    { value: "week", label: ui.week },
    { value: "today", label: ui.today },
    { value: "weekend", label: ui.weekend },
    { value: "date", label: dateChipLabel },
    { value: "all", label: ui.allMarkets },
  ];
  const selectMode = (nextMode: DateFilterMode) => {
    onModeChange(nextMode);
    if (nextMode !== "date") return;
    const input = dateInputRef.current;
    if (!input) return;
    try {
      if (input.showPicker) input.showPicker();
      else {
        setShowDateFallback(true);
        input.focus();
      }
    } catch {
      setShowDateFallback(true);
      input.focus();
    }
  };

  return (
    <section className="market-filters" aria-label={ui.filterLabel}>
      <div className="market-filter-search-row">
        <a className="mobile-home-brand" href={locale === "en" ? "/en" : "/"} aria-label={ui.homeLabel}>
          <span className="mobile-app-bar-mark" aria-hidden="true"><BrandMark /></span>
        </a>
        <label className="search-field">
          <span className="sr-only">{ui.searchLabel}</span>
          <Icon name="search" />
          <input
            type="search"
            aria-label={ui.searchLabel}
            value={query}
            placeholder={ui.searchPlaceholder}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {query ? (
            <button type="button" className="search-clear" aria-label={ui.clearSearch} onClick={() => onQueryChange("")}>
              <Icon name="close" />
            </button>
          ) : null}
        </label>
        {onMobileSearchOpen ? <button type="button" className="mobile-search-launch" aria-label={ui.searchLabel} onClick={onMobileSearchOpen}>
          <Icon name="search" />
          <span>{query || ui.searchPlaceholder}</span>
        </button> : null}
        {mobileMenuControl}
      </div>

      <div className="date-filter-row" aria-label={ui.dateRange}>
        <div className="filter-pills">
          {modes.map((item) => (
            <button
              key={item.value}
              ref={mode === item.value ? selectedChipRef : undefined}
              type="button"
              className="filter-pill"
              aria-pressed={mode === item.value}
              onClick={() => selectMode(item.value)}
            >
              {item.value === "date" ? <Icon name="calendar" /> : null}
              {item.label}
            </button>
          ))}
        </div>
        <label className={`direct-date ${mode === "date" ? "is-visible" : ""} ${showDateFallback ? "is-fallback" : ""}`}>
          <span>{ui.date}</span>
          <input
            ref={dateInputRef}
            type="date"
            value={directDate}
            min={minDate}
            onChange={(event) => { setShowDateFallback(false); onDirectDateChange(event.target.value); }}
            onFocus={() => onModeChange("date")}
          />
        </label>
      </div>
    </section>
  );
}
