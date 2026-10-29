"use client";

import { useEffect, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { getKoreaCalendarDate } from "../lib/korea-date";
import { formatKoreanDate, formatSchedulePattern, getDday } from "../lib/market-view";
import { getNextMarketDate } from "../lib/schedule";

interface MarketNextDateProps {
  market: PublicMarket;
  /** 서버가 계산한 한국 날짜(YYYY-MM-DD). 검색엔진이 받는 HTML에도 다음 장날이 들어가게 한다. */
  initialToday?: string;
}

const parseCalendarDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function MarketNextDate({ market, initialToday }: MarketNextDateProps) {
  const [today, setToday] = useState<Date | null>(() => (initialToday ? parseCalendarDate(initialToday) : null));

  useEffect(() => {
    setToday(getKoreaCalendarDate(new Date()));
  }, []);

  if (market.schedule.kind === "daily") {
    return (
      <section aria-label="다음 장날">
        <p>운영 일정</p>
        <strong>공공데이터상 매일 운영</strong>
        <p>점포별 영업일과 정기휴무는 방문 전 확인하세요.</p>
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
