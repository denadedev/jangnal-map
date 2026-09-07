"use client";

import { useEffect, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { formatKoreanDate, formatSchedulePattern, getDday } from "../lib/market-view";
import { getNextMarketDate } from "../lib/schedule";

interface MarketNextDateProps {
  market: PublicMarket;
}

export function MarketNextDate({ market }: MarketNextDateProps) {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  if (market.schedule.kind === "daily") {
    return (
      <section aria-label="다음 장날">
        <p>운영 일정</p>
        <strong>매일 운영</strong>
        <span>오늘 운영</span>
      </section>
    );
  }

  if (market.schedule.kind === "unknown") {
    return (
      <section aria-label="다음 장날">
        <p>운영 일정</p>
        <strong>운영 일정 확인 필요</strong>
      </section>
    );
  }

  const nextDate = today ? getNextMarketDate(market, today) : null;
  const dday = nextDate && today ? getDday(nextDate, today) : null;

  return (
    <section aria-label="다음 장날">
      <p>다음 장날</p>
      <strong>{nextDate ? formatKoreanDate(nextDate) : formatSchedulePattern(market)}</strong>
      {dday !== null ? <span>{dday === 0 ? "오늘 장날" : `D-${dday}`}</span> : null}
    </section>
  );
}
