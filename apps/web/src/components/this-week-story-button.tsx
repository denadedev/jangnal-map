"use client";

import { useState } from "react";

import { getKoreaCalendarDate } from "../lib/korea-date";
import type { PublicMarket } from "../lib/market";
import { MenuSubmissionFlow } from "./today-highlight-prompt";

/** "다녀온 장 이야기 들려주기". 누르면 시장 목록을 받아 장 고르기부터 연다. */
export function ThisWeekStoryButton({ className, label = "다녀온 장 이야기 들려주기" }: { className?: string; label?: string }) {
  const [markets, setMarkets] = useState<PublicMarket[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const open = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch("/api/markets");
      if (!response.ok) throw new Error(String(response.status));
      setMarkets(await response.json() as PublicMarket[]);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className={className} disabled={loading} onClick={() => void open()}>{label}</button>
      {failed ? <p role="alert">시장 목록을 불러오지 못했어요. 잠시 뒤에 다시 눌러 주세요.</p> : null}
      {markets ? (
        <MenuSubmissionFlow markets={markets} today={getKoreaCalendarDate(new Date())} currentLocation={null} source="this_week" onClose={() => setMarkets(null)} />
      ) : null}
    </>
  );
}
