"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { PublicMarket } from "../lib/market";
import type { MarketHighlight } from "../lib/market-highlight";
import { formatSchedulePattern, sortMarketsByDistance, toIsoDate, type Coordinates } from "../lib/market-view";
import { getMarketDates } from "../lib/schedule";
import { Icon } from "./icon";
import { formatPatternDigits } from "./jangnal-number";
import { CATEGORY_ICONS, HighlightSubmissionSheet, readStorage, SheetOverlay, track, writeStorage, type HighlightMarketRef, type SubmissionSource } from "./market-highlights";
import styles from "./market-highlights.module.css";

const DISMISS_KEY = "jangnal:today-highlight-card-dismissed";
/** 이야기 카드는 "오늘 열린 장" 카드를 닫았다고 같이 숨지 않도록 따로 기억한다. */
const STORY_DISMISS_KEY = "jangnal:story-list-card-dismissed";
const PICKER_LIMIT = 50;
const LATEST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** 버튼이 들어온 뒤(400ms 대기 + 240ms) 펼치고, 0.3초 펼침을 포함해 4.8초 뒤 접는다. */
const LATEST_OPEN_DELAY_MS = 700;
const LATEST_HOLD_MS = 4800;
/** 목록 위 이야기 카드에 바로 보이는 수와, "더 보기" 시트가 한 번에 늘리는 수. */
const STORY_CARD_LIMIT = 3;
const STORY_SHEET_PAGE = 20;

export interface LatestStory {
  highlight: MarketHighlight;
  market: PublicMarket;
}

const storyKey = ({ marketId, name, createdAt }: MarketHighlight) => `${marketId}:${name}:${createdAt}`;
/** 이번 방문(페이지 로드)에서 이미 펼친 제보. 상세를 닫거나 검색을 지워 버튼이 다시 그려져도 또 펼치지 않는다. */
let shownStoryKey: string | null = null;

/**
 * 7일 안에 승인된 가장 최근 제보를 사이트에 들어올 때마다 잠깐 보여 준다.
 * 펼쳐 있는 동안만 값이 있다.
 */
function useLatestStory(markets: PublicMarket[], enabled: boolean): LatestStory | null {
  const [story, setStory] = useState<LatestStory | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timers: number[] = [];
    fetch("/api/highlights/latest")
      .then((response) => response.ok ? response.json() as Promise<{ highlight: MarketHighlight | null }> : { highlight: null })
      .catch(() => ({ highlight: null }))
      .then(({ highlight }) => {
        if (cancelled || !highlight) return;
        const market = markets.find((candidate) => candidate.id === highlight.marketId);
        const age = Date.now() - Date.parse(highlight.createdAt);
        if (!market || !(age <= LATEST_MAX_AGE_MS) || shownStoryKey === storyKey(highlight)) return;
        timers.push(window.setTimeout(() => {
          shownStoryKey = storyKey(highlight);
          track("latest_story_view", { category: highlight.category });
          setStory({ highlight, market });
        }, LATEST_OPEN_DELAY_MS));
        timers.push(window.setTimeout(() => setStory(null), LATEST_OPEN_DELAY_MS + LATEST_HOLD_MS));
      });
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  // 지도에 들어올 때 한 번만 본다. 버튼은 시장 목록을 다 읽은 뒤에 그려지므로 그때 목록으로 충분하다.
  }, [enabled]);
  return story;
}

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
function SubmissionFlow({ markets, todayMarkets, suggestedLabel, source, onClose }: {
  markets: PublicMarket[];
  todayMarkets: PublicMarket[];
  suggestedLabel?: string;
  source: SubmissionSource;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>({ kind: "picking" });
  return step.kind === "picking" ? (
    <MarketPicker markets={markets} todayMarkets={todayMarkets} suggestedLabel={suggestedLabel} onPick={(market) => setStep({ kind: "writing", market })} onClose={onClose} />
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

function StoryRow({ story, onOpen }: { story: LatestStory; onOpen: () => void }) {
  const { highlight, market } = story;
  return (
    <button type="button" className={styles.storyRow} onClick={onOpen}>
      <span className={styles.categoryIcon} aria-hidden="true"><Icon name={CATEGORY_ICONS[highlight.category]} /></span>
      <span className={styles.storyCopy}>
        <span className={styles.storyMarket}>{market.name}</span>
        <strong className={styles.what}>{highlight.name}</strong>
        {highlight.description ? <span className={styles.description}>{highlight.description}</span> : null}
      </span>
      <Icon name="more" className={styles.chevron} />
    </button>
  );
}

/** "더 보기"로 여는 같은 필터의 이야기 전체. 맨 아래에서 바로 제보로 이어진다. */
function StorySheet({ title, stories, onOpenStory, onWrite, onClose }: { title: string; stories: LatestStory[]; onOpenStory: (story: LatestStory) => void; onWrite: () => void; onClose: () => void }) {
  const [shown, setShown] = useState(STORY_SHEET_PAGE);
  const titleId = useId();
  return (
    <SheetOverlay labelledBy={titleId} onClose={onClose} className={styles.pickerSheet}>
      <div className={styles.sheetHead}>
        <h2 id={titleId}>{title} <span className={styles.count}>{stories.length}</span></h2>
        <button type="button" className={styles.iconButton} aria-label="닫기" onClick={onClose}><Icon name="close" /></button>
      </div>
      <ul className={styles.pickerList}>
        {stories.slice(0, shown).map((story) => (
          <li key={`${story.market.id}:${story.highlight.name}`}><StoryRow story={story} onOpen={() => onOpenStory(story)} /></li>
        ))}
        {stories.length > shown ? (
          <li><button type="button" className={styles.storyMore} onClick={() => setShown((count) => count + STORY_SHEET_PAGE)}>더 보기</button></li>
        ) : null}
      </ul>
      <button type="button" className={styles.primary} onClick={onWrite}>나도 알려 주기</button>
    </SheetOverlay>
  );
}

/**
 * 메인 지도 결과 목록 위 카드. 지금 필터에 걸린 시장들의 방문자 이야기를 최근 순으로 보여 주고,
 * 이야기가 없으면 "오늘 열린 장 다녀오셨나요?" 카드를 대신 보여 준다.
 */
export function StoryListCard({ markets, today, currentLocation, stories, title, filter, onOpenStory }: TodayHighlightPromptProps & {
  /** 필터에 걸린 시장들의 제보, 최근 승인 순. */
  stories: MarketHighlight[];
  title: string;
  /** Umami에 남길 필터 이름. */
  filter: string;
  onOpenStory: (story: LatestStory) => void;
}) {
  const todayIso = toIsoDate(today);
  const [dismissedOn, setDismissedOn] = useState<string | null>(todayIso);
  const [sheet, setSheet] = useState<"list" | "write" | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => setDismissedOn(readStorage(STORY_DISMISS_KEY)), []);
  const todayMarkets = useTodayMarkets(markets, today, currentLocation);
  const items = useMemo(() => {
    const byId = new Map(markets.map((market) => [market.id, market]));
    return stories.flatMap((highlight) => {
      const market = byId.get(highlight.marketId);
      return market ? [{ highlight, market }] : [];
    });
  }, [markets, stories]);
  const visible = items.length > 0 && dismissedOn !== todayIso;
  useEffect(() => {
    if (visible) track("story_list_view", { filter, count: String(items.length) });
  // 필터를 바꿔 다른 이야기가 보일 때마다 한 번 센다.
  }, [filter, visible]);

  if (items.length === 0) return <TodayHighlightPrompt markets={markets} today={today} currentLocation={currentLocation} />;
  if (!visible) return null;
  const open = (story: LatestStory) => {
    track("story_list_open", { filter });
    setSheet(null);
    onOpenStory(story);
  };
  const closeSheet = () => { setSheet(null); moreRef.current?.focus(); };

  return (
    <div className={styles.storyCard} role="group" aria-labelledby={titleId}>
      <button type="button" className={styles.contextClose} aria-label="닫기" onClick={() => {
        writeStorage(STORY_DISMISS_KEY, todayIso);
        track("story_list_dismiss", { filter });
        setDismissedOn(todayIso);
      }}><Icon name="close" /></button>
      <p id={titleId} className={styles.contextTitle}>{title}</p>
      <ul className={styles.storyRows}>
        {items.slice(0, STORY_CARD_LIMIT).map((story) => (
          <li key={`${story.market.id}:${story.highlight.name}`}><StoryRow story={story} onOpen={() => open(story)} /></li>
        ))}
      </ul>
      {items.length > STORY_CARD_LIMIT ? (
        <button ref={moreRef} type="button" className={styles.storyMore} onClick={() => {
          track("story_list_more", { filter, count: String(items.length) });
          setSheet("list");
        }}>이야기 {items.length - STORY_CARD_LIMIT}개 더 보기<Icon name="more" className={styles.chevron} /></button>
      ) : null}
      {sheet === "list" ? <StorySheet title={title} stories={items} onOpenStory={open} onWrite={() => setSheet("write")} onClose={closeSheet} /> : null}
      {sheet === "write" ? <SubmissionFlow markets={markets} todayMarkets={todayMarkets} source="story_list" onClose={closeSheet} /> : null}
    </div>
  );
}

/** 메인 지도 왼쪽 위에 늘 떠 있는 제보 버튼. 시트를 펼치지 않아도 보인다.
 * Threads 링크로 시장 묶음이 떠 있으면 고르는 목록에 그 시장들을 먼저 보여 준다. */
export function MapParticipateButton({ markets, today, currentLocation, suggested, onOpenStory }: TodayHighlightPromptProps & {
  suggested?: { markets: PublicMarket[]; label: string };
  /** 펼쳐진 "새 이야기"를 누르면 그 시장 상세로 보낸다. 없으면 펼치지 않는다. */
  onOpenStory?: (story: LatestStory) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const todayMarkets = useTodayMarkets(markets, today, currentLocation);
  const story = useLatestStory(markets, Boolean(onOpenStory));
  const label = todayMarkets.length > 0 ? "오늘 장 꿀팁 한 줄 남기기" : "단골 장 꿀팁 남기기";

  return (
    <>
      <button ref={buttonRef} type="button" className={`${styles.mapButton} map-participate-button`} onClick={() => {
        if (story) {
          track("latest_story_open", { category: story.highlight.category });
          onOpenStory?.(story);
          return;
        }
        track("highlight_map_button_open", { today: todayMarkets.length > 0 ? "yes" : "no" });
        setOpen(true);
      }}>
        <Icon name={story ? "chat" : "pen"} />
        {story ? (
          <span key="story" className={styles.mapButtonStory}><strong>새 이야기</strong> · {story.market.name} “{story.highlight.name}”</span>
        ) : <span key="label" className={styles.mapButtonLabel}>{label}</span>}
      </button>
      {open ? (
        <SubmissionFlow
          markets={markets}
          todayMarkets={suggested?.markets ?? todayMarkets}
          suggestedLabel={suggested?.label}
          source={suggested ? "map_set" : "map_button"}
          onClose={() => { setOpen(false); buttonRef.current?.focus(); }} />
      ) : null}
    </>
  );
}

/** 서비스 메뉴의 "다녀온 장 이야기 들려주기". 메뉴를 닫고 바로 장 고르기부터 연다. */
export function MenuSubmissionFlow({ markets, today, currentLocation, source = "menu", onClose }: TodayHighlightPromptProps & { source?: SubmissionSource; onClose: () => void }) {
  const todayMarkets = useTodayMarkets(markets, today, currentLocation);
  return <SubmissionFlow markets={markets} todayMarkets={todayMarkets} source={source} onClose={onClose} />;
}

function MarketPicker({ markets, todayMarkets, suggestedLabel = "오늘 열린 장", onPick, onClose }: { markets: PublicMarket[]; todayMarkets: PublicMarket[]; suggestedLabel?: string; onPick: (market: PublicMarket) => void; onClose: () => void }) {
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
          <span className={styles.market}>{todayMarkets.length > 0 ? `${suggestedLabel} ${todayMarkets.length}곳 · 다른 장은 검색해 주세요` : "시장 이름이나 지역으로 찾아 주세요"}</span>
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
                  <span><strong>{market.name}</strong><span>{keyword && todayIds.has(market.id) && suggestedLabel === "오늘 열린 장" ? <><em className={styles.pickerToday}>오늘 열림</em> · </> : null}{market.roadAddress ?? market.lotAddress ?? ""}</span></span>
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
