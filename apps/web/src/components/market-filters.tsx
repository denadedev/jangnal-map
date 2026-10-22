"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";
import type { ReactNode } from "react";
import { BrandMark, Icon } from "./icon";

export type DateFilterMode = "all" | "today" | "weekend";

export interface MarketFiltersProps {
  locale?: Locale;
  mode: DateFilterMode;
  query: string;
  onModeChange: (mode: DateFilterMode) => void;
  onQueryChange: (query: string) => void;
  onMobileSearchOpen?: () => void;
  mobileMenuControl?: ReactNode;
}

export function MarketFilters(_props: MarketFiltersProps) {
  const { locale = "ko", mode, query, onModeChange, onQueryChange, onMobileSearchOpen, mobileMenuControl } = _props;
  const ui = getUiCopy(locale);
  const selectedChipRef = useRef<HTMLButtonElement>(null);
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
  const modes: Array<{ value: DateFilterMode; label: string }> = [
    { value: "today", label: ui.today },
    { value: "weekend", label: ui.weekend },
    { value: "all", label: ui.allMarkets },
  ];
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
              onClick={() => onModeChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
