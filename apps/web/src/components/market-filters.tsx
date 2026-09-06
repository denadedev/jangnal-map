"use client";

import { useRef } from "react";

export type DateFilterMode = "all" | "today" | "week" | "weekend" | "date";

interface MarketFiltersProps {
  mode: DateFilterMode;
  query: string;
  directDate: string;
  minDate?: string;
  onModeChange: (mode: DateFilterMode) => void;
  onQueryChange: (query: string) => void;
  onDirectDateChange: (date: string) => void;
}

export function MarketFilters(_props: MarketFiltersProps) {
  const { mode, query, directDate, minDate, onModeChange, onQueryChange, onDirectDateChange } = _props;
  const dateInputRef = useRef<HTMLInputElement>(null);
  const modes: Array<{ value: DateFilterMode; label: string }> = [
    { value: "all", label: "전체" },
    { value: "today", label: "오늘" },
    { value: "week", label: "이번 주" },
    { value: "weekend", label: "주말" },
    { value: "date", label: "날짜 선택" },
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
    <section className="market-filters" aria-label="시장 검색 및 날짜 필터">
      <label className="search-field">
        <span className="sr-only">시장명 또는 지역 검색</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder="시장명 또는 지역을 검색하세요"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {query ? (
          <button type="button" className="search-clear" aria-label="검색어 지우기" onClick={() => onQueryChange("")}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
        ) : null}
      </label>

      <div className="date-filter-row" aria-label="날짜 범위">
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
          <span>날짜</span>
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
