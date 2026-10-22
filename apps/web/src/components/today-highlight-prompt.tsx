"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { formatSchedulePattern, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { getMarketDates } from "../lib/schedule";
import { Icon } from "./icon";
import { formatPatternDigits } from "./jangnal-number";
import { HighlightSubmissionSheet, readStorage, SheetOverlay, track, writeStorage, type HighlightMarketRef, type SubmissionSource } from "./market-highlights";
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

type Step = { kind: "picking" } | { kind: "writing"; market: PublicMarket };

/** 오늘 열린 5일장. 상설시장은 매일 열려 "다녀오셨나요?"가 의미 없어 뺀다. 위치를 알면 가까운 순. */
const useTodayMarkets = (markets: PublicMarket[], today: Date, currentLocation: Coordinates | null) => useMemo(() => {
  const open = markets.filter((market) => market.schedule.kind === "digit-pair" && getMarketDates(market, { start: today, end: today }).length > 0);
  return currentLocation ? sortMarketsByDistance(open, currentLocation) : open;
}, [currentLocation, markets, today]);

/** 장을 고른 뒤 제보 시트로 이어지는 흐름. "바꾸기"를 누르면 다시 고른다. */
function SubmissionFlow({ markets, todayMarkets, source, onClose }: {
  markets: PublicMarket[];
  todayMarkets: PublicMarket[];
  source: SubmissionSource;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "picking" });
  return step.kind === "picking" ? (
    <MarketPicker markets={markets} todayMarkets={todayMarkets} onPick={(market) => setStep({ kind: "writing", market })} onClose={onClose} />
  ) : (
    <HighlightSubmissionSheet
      market={toRef(step.market)}
      source={source}
      nearbyMarkets={findNearbyMarkets(step.market, markets)}
      onChangeMarket={() => setStep({ kind: "picking" })}
      onClose={onClose}
    />
  );
}

/** 메인 지도 결과 시트의 "오늘 열린 장 다녀오셨나요?" 카드. 장을 고르면 제보 시트로 이어진다. */
export function TodayHighlightPrompt({ markets, today, currentLocation }: TodayHighlightPromptProps) {
  const todayIso = toIsoDate(today);
  const [dismissedOn, setDismissedOn] = useState<string | null>(todayIso);
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => setDismissedOn(readStorage(DISMISS_KEY)), []);
  const todayMarkets = useTodayMarkets(markets, today, currentLocation);

  if (todayMarkets.length === 0 || dismissedOn === todayIso) return null;

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
        setOpen(true);
      }}><Icon name="pen" />알려 주기</button>
      {open ? (
        <SubmissionFlow markets={markets} todayMarkets={todayMarkets} source="map_today" onClose={() => { setOpen(false); openButtonRef.current?.focus(); }} />
      ) : null}
    </div>
  );
}

/** 메인 지도 왼쪽 위에 늘 떠 있는 제보 버튼. 시트를 펼치지 않아도 보인다. */
export function MapParticipateButton({ markets, today, currentLocation }: TodayHighlightPromptProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const todayMarkets = useTodayMarkets(markets, today, currentLocation);
  const label = todayMarkets.length > 0 ? "오늘 장 꿀팁 한 줄 남기기" : "단골 장 꿀팁 남기기";

  return (
    <>
      <button ref={buttonRef} type="button" className={`${styles.mapButton} map-participate-button`} onClick={() => {
        track("highlight_map_button_open", { today: todayMarkets.length > 0 ? "yes" : "no" });
        setOpen(true);
      }}><Icon name="pen" />{label}</button>
      {open ? (
        <SubmissionFlow markets={markets} todayMarkets={todayMarkets} source="map_button" onClose={() => { setOpen(false); buttonRef.current?.focus(); }} />
      ) : null}
    </>
  );
}

/** 서비스 메뉴의 "다녀온 장 이야기 들려주기". 메뉴를 닫고 바로 장 고르기부터 연다. */
export function MenuSubmissionFlow({ markets, today, currentLocation, onClose }: TodayHighlightPromptProps & { onClose: () => void }) {
  const todayMarkets = useTodayMarkets(markets, today, currentLocation);
  return <SubmissionFlow markets={markets} todayMarkets={todayMarkets} source="menu" onClose={onClose} />;
}

function MarketPicker({ markets, todayMarkets, onPick, onClose }: { markets: PublicMarket[]; todayMarkets: PublicMarket[]; onPick: (market: PublicMarket) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const searchId = useId();
  useEffect(() => { searchRef.current?.focus(); }, []);

  // 검색어가 없으면 오늘 열린 장만, 있으면 전국 시장에서 찾되 오늘 열린 장을 먼저 둔다.
  const keyword = query.trim();
  const matchesKeyword = (market: PublicMarket) => market.name.includes(keyword) || (market.roadAddress ?? market.lotAddress ?? "").includes(keyword);
  const todayIds = new Set(todayMarkets.map((market) => market.id));
  const matches = keyword
    ? [...todayMarkets.filter(matchesKeyword), ...markets.filter((market) => !todayIds.has(market.id) && matchesKeyword(market))]
    : todayMarkets;

  return (
    <SheetOverlay labelledBy={titleId} onClose={onClose} className={styles.pickerSheet}>
      <div className={styles.sheetHead}>
        <div>
          <h2 id={titleId}>어느 장이었나요?</h2>
          <span className={styles.market}>{todayMarkets.length > 0 ? `오늘 열린 장 ${todayMarkets.length}곳 · 다른 장은 검색해 주세요` : "시장 이름이나 지역으로 찾아 주세요"}</span>
        </div>
        <button type="button" className={styles.iconButton} aria-label="닫기" onClick={onClose}><Icon name="close" /></button>
      </div>
      <label className={styles.visuallyHidden} htmlFor={searchId}>시장명 또는 지역 검색</label>
      <input ref={searchRef} id={searchId} className={`${styles.input} ${styles.pickerSearch}`} type="search" placeholder="시장명 또는 지역 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
      {matches.length === 0 ? (keyword ? <p className={styles.pickerEmpty}>찾는 시장이 없어요.</p> : null) : (
        <ul className={styles.pickerList}>
          {matches.slice(0, PICKER_LIMIT).map((market) => {
            const digits = formatPatternDigits(market);
            return (
              <li key={market.id}>
                <button type="button" className={styles.pickerRow} onClick={() => onPick(market)}>
                  <span className={`${styles.pickerTile} ${todayIds.has(market.id) ? "" : styles.pickerTileIdle} ${digits ? "jn" : styles.pickerTilePlain}`} aria-hidden="true">{digits ?? "상설"}</span>
                  <span><strong>{market.name}</strong><span>{keyword && todayIds.has(market.id) ? <><em className={styles.pickerToday}>오늘 열림</em> · </> : null}{market.roadAddress ?? market.lotAddress ?? ""}</span></span>
                  <Icon name="more" className={styles.chevron} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SheetOverlay>
  );
}
