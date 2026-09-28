"use client";

import { useEffect, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { getMarketPagePath } from "../lib/market-path";
import { getNextMarketDate } from "../lib/schedule";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

interface MarketShareButtonProps {
  locale?: Locale;
  market: PublicMarket;
  sharePath?: string;
  today?: Date;
  selectedDate?: Date;
  className?: string;
}

export function MarketShareButton({ locale = "ko", market, sharePath, today, selectedDate, className }: MarketShareButtonProps) {
  const ui = getUiCopy(locale);
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
      const messageDate = locale === "en" ? selectedDate ?? nextDate : nextDate;
      const datePrefix = messageDate ? locale === "en"
        ? `${new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(messageDate)}: `
        : `${messageDate.getMonth() + 1}월 ${messageDate.getDate()}일 ` : "";
      const url = `${window.location.origin}${sharePath ?? getMarketPagePath(market)}`;

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `${market.name} | ${ui.brand}`,
            text: locale === "en" ? `${datePrefix}${market.name}. Want to visit?` : `${datePrefix}${market.name}, 같이 갈래요?`,
            url,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setFeedback({ marketId: market.id, message: ui.copySucceeded, isError: false });
      } catch {
        setFeedback({ marketId: market.id, message: ui.copyFailed, isError: true });
      }
    } finally {
      isSharingRef.current = false;
      setIsSharing(false);
    }
  };

  const visibleFeedback = feedback?.marketId === market.id ? feedback : null;

  return (
    <>
      <button type="button" className={className} disabled={isSharing} onClick={() => void shareMarket()}>{ui.share}</button>
      {visibleFeedback ? (
        <span className="share-feedback" role={visibleFeedback.isError ? "alert" : "status"}>
          {visibleFeedback.message}
        </span>
      ) : null}
    </>
  );
}
