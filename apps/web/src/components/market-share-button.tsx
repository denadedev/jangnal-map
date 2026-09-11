"use client";

import { useEffect, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { getMarketPagePath } from "../lib/market-path";
import { getNextMarketDate } from "../lib/schedule";

interface MarketShareButtonProps {
  market: PublicMarket;
  today?: Date;
  className?: string;
}

export function MarketShareButton({ market, today, className }: MarketShareButtonProps) {
  const [feedback, setFeedback] = useState<{ marketId: string; message: string; isError: boolean } | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const isSharingRef = useRef(false);

  useEffect(() => {
    setFeedback(null);
  }, [market.id]);

  const shareMarket = async () => {
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    setIsSharing(true);
    setFeedback(null);

    try {
      const referenceDate = today ?? new Date();
      const nextDate = market.schedule.kind === "digit-pair"
        ? getNextMarketDate(market, referenceDate)
        : null;
      const datePrefix = nextDate ? `${nextDate.getMonth() + 1}월 ${nextDate.getDate()}일 ` : "";
      const url = `${window.location.origin}${getMarketPagePath(market)}`;

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `${market.name} | 오늘 장날`,
            text: `${datePrefix}${market.name}, 같이 갈래요?`,
            url,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setFeedback({ marketId: market.id, message: "링크를 복사했어요", isError: false });
      } catch {
        setFeedback({ marketId: market.id, message: "링크를 복사하지 못했어요", isError: true });
      }
    } finally {
      isSharingRef.current = false;
      setIsSharing(false);
    }
  };

  const visibleFeedback = feedback?.marketId === market.id ? feedback : null;

  return (
    <>
      <button type="button" className={className} disabled={isSharing} onClick={() => void shareMarket()}>공유하기</button>
      {visibleFeedback ? (
        <span className="share-feedback" role={visibleFeedback.isError ? "alert" : "status"}>
          {visibleFeedback.message}
        </span>
      ) : null}
    </>
  );
}
