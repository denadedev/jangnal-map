"use client";

import { useState, type ReactNode } from "react";

import { getKoreaCalendarDate } from "../lib/korea-date";
import type { PublicMarket } from "../lib/market";
import type { SubmissionSource } from "./market-highlights";
import { MenuSubmissionFlow } from "./today-highlight-prompt";

/** "다녀온 장 이야기 들려주기". 시장 목록이 없는 화면에서 누르면 목록을 받아 장 고르기부터 연다. */
export function StoryPickerButton({ className, source, children = "다녀온 장 이야기 들려주기" }: { className?: string; source: SubmissionSource; children?: ReactNode }) {
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
      <button type="button" className={className} disabled={loading} onClick={() => void open()}>{children}</button>
      {failed ? <p role="alert">시장 목록을 불러오지 못했어요. 잠시 뒤에 다시 눌러 주세요.</p> : null}
      {markets ? (
        <MenuSubmissionFlow markets={markets} today={getKoreaCalendarDate(new Date())} currentLocation={null} source={source} onClose={() => setMarkets(null)} />
      ) : null}
    </>
  );
}
