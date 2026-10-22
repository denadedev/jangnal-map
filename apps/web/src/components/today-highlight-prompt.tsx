"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { formatSchedulePattern, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { getMarketDates } from "../lib/schedule";
import { Icon } from "./icon";
import { formatPatternDigits } from "./jangnal-number";
import { HighlightSubmissionSheet, readStorage, SheetOverlay, track, writeStorage, type HighlightMarketRef } from "./market-highlights";
import styles from "./market-highlights.module.css";

const DISMISS_KEY = "jangnal:today-highlight-card-dismissed";
const PICKER_LIMIT = 50;

const addressPrefix = (market: PublicMarket): string =>
  (market.roadAddress ?? market.lotAddress ?? "").split(/\s+/).slice(0, 2).join(" ");

const toRef = (market: PublicMarket): HighlightMarketRef => ({ id: market.id, name: market.name, scheduleLabel: formatSchedulePattern(market) });

/** 같은 시·군·구의 다른 시장. 제보를 마친 뒤 "같은 지역 다른 장도 아시나요?"에 쓴다. */
export function findNearbyMarkets(market: PublicMarket, markets: PublicMarket[], limit = 3): HighlightMarketRef[] {
  const prefix = addressPrefix(market);
  if (!prefix) return [];
  return markets.filter((candidate) => candidate.id !== market.id && addressPrefix(candidate) === prefix).slice(0, limit).map(toRef);
}

interface TodayHighlightPromptProps {
  markets: PublicMarket[];
  today: Date;
  currentLocation: Coordinates | null;
}

type Step = { kind: "closed" } | { kind: "picking" } | { kind: "writing"; market: PublicMarket };

/** 메인 지도 결과 시트의 "오늘 열린 장 다녀오셨나요?" 카드. 장을 고르면 제보 시트로 이어진다. */
export function TodayHighlightPrompt({ markets, today, currentLocation }: TodayHighlightPromptProps) {
  const todayIso = toIsoDate(today);
  const [dismissedOn, setDismissedOn] = useState<string | null>(todayIso);
  const [step, setStep] = useState<Step>({ kind: "closed" });
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => setDismissedOn(readStorage(DISMISS_KEY)), []);

  // 상설시장은 매일 열려 "다녀오셨나요?"가 의미 없다. 오늘이 장날인 5일장만 고른다.
  const todayMarkets = useMemo(() => {
    const open = markets.filter((market) => market.schedule.kind === "digit-pair" && getMarketDates(market, { start: today, end: today }).length > 0);
    return currentLocation ? sortMarketsByDistance(open, currentLocation) : open;
  }, [currentLocation, markets, today]);

  if (todayMarkets.length === 0 || dismissedOn === todayIso) return null;

  const close = () => { setStep({ kind: "closed" }); openButtonRef.current?.focus(); };

  return (
    <div className={styles.todayCard} role="group" aria-labelledby={titleId}>
      <button type="button" className={styles.contextClose} aria-label="닫기" onClick={() => {
        writeStorage(DISMISS_KEY, todayIso);
        track("highlight_today_card_dismiss");
        setDismissedOn(todayIso);
      }}><Icon name="close" /></button>
      <p id={titleId} className={styles.contextTitle}>오늘 열린 장 다녀오셨나요?</p>
      <p className={styles.contextBody}>어디서 뭐가 좋았는지 알려 주세요</p>
      <button ref={openButtonRef} type="button" className={styles.todayAction} onClick={() => {
        track("highlight_today_card_open");
        setStep({ kind: "picking" });
      }}><Icon name="pen" />알려 주기</button>
      {step.kind === "picking" ? (
        <TodayMarketPicker markets={todayMarkets} onPick={(market) => setStep({ kind: "writing", market })} onClose={close} />
      ) : null}
      {step.kind === "writing" ? (
        <HighlightSubmissionSheet
          market={toRef(step.market)}
          source="map_today"
          nearbyMarkets={findNearbyMarkets(step.market, markets)}
          onChangeMarket={() => setStep({ kind: "picking" })}
          onClose={close}
        />
      ) : null}
    </div>
  );
}

function TodayMarketPicker({ markets, onPick, onClose }: { markets: PublicMarket[]; onPick: (market: PublicMarket) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const searchId = useId();
  useEffect(() => { searchRef.current?.focus(); }, []);

  const keyword = query.trim();
  const matches = keyword
    ? markets.filter((market) => market.name.includes(keyword) || (market.roadAddress ?? market.lotAddress ?? "").includes(keyword))
    : markets;

  return (
    <SheetOverlay labelledBy={titleId} onClose={onClose}>
      <div className={styles.sheetHead}>
        <div>
          <h2 id={titleId}>어느 장이었나요?</h2>
          <span className={styles.market}>오늘 열린 장 {markets.length}곳</span>
        </div>
        <button type="button" className={styles.iconButton} aria-label="닫기" onClick={onClose}><Icon name="close" /></button>
      </div>
      <label className={styles.visuallyHidden} htmlFor={searchId}>시장명 또는 지역 검색</label>
      <input ref={searchRef} id={searchId} className={`${styles.input} ${styles.pickerSearch}`} type="search" placeholder="시장명 또는 지역 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
      {matches.length === 0 ? <p className={styles.pickerEmpty}>오늘 열린 장 중에 찾는 곳이 없어요.</p> : (
        <ul className={styles.pickerList}>
          {matches.slice(0, PICKER_LIMIT).map((market) => (
            <li key={market.id}>
              <button type="button" className={styles.pickerRow} onClick={() => onPick(market)}>
                <span className={`${styles.pickerTile} jn`} aria-hidden="true">{formatPatternDigits(market)}</span>
                <span><strong>{market.name}</strong><span>{market.roadAddress ?? market.lotAddress ?? ""}</span></span>
                <Icon name="more" className={styles.chevron} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SheetOverlay>
  );
}
