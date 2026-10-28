"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { HIGHLIGHT_CATEGORY_LABELS, type HighlightCategoryCode } from "../db/codes";
import { HIGHLIGHT_DESCRIPTION_MAX, HIGHLIGHT_NAME_MAX } from "../lib/highlight-submission";
import { getKoreaCalendarDate } from "../lib/korea-date";
import type { PublicMarket } from "../lib/market";
import type { MarketHighlight } from "../lib/market-highlight";
import { toIsoDate } from "../lib/market-view";
import { getMarketDates } from "../lib/schedule";
import { Icon, type IconName } from "./icon";
import styles from "./market-highlights.module.css";

export const CATEGORY_ICONS: Record<HighlightCategoryCode, IconName> = { specialty: "sprout", food: "bowl", tip: "bulb", sight: "star" };
const CATEGORIES = Object.keys(HIGHLIGHT_CATEGORY_LABELS) as HighlightCategoryCode[];
const NAME_PLACEHOLDERS: Record<HighlightCategoryCode, string> = { specialty: "예: 미나리", food: "예: 수수 부꾸미", tip: "예: 주차", sight: "예: 장터 공연" };
/** 지도의 "새 이야기"로 들어오면 스크롤해 갈 섹션. 한 화면에 섹션은 하나뿐이다. */
const SECTION_ID = "visitor-highlights";
const CONTEXT_DISMISS_KEY = "jangnal:highlight-context-dismissed";

/** 제보 시트가 어디서 열렸는지. Umami 이벤트의 source로 남겨 진입점별로 비교한다. */
export type SubmissionSource = "section_chip" | "more_chip" | "context" | "followup" | "map_today" | "map_button" | "menu" | "map_set" | "latest" | "story_list" | "this_week" | "stories_tab";

/** 제보 시트가 다루는 시장. 완료 화면의 "같은 지역 다른 장"에도 쓴다. */
export interface HighlightMarketRef {
  id: string;
  name: string;
  scheduleLabel: string;
}

type WindowWithUmami = Window & { umami?: { track: (event: string, data?: Record<string, string>) => void } };

export const track = (event: string, data?: Record<string, string>) => (window as WindowWithUmami).umami?.track(event, data);

export const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장하지 못하면 다음에 다시 보일 뿐이다.
  }
};

// 지도 패널은 티저와 섹션이 같은 시장 제보를 따로 읽는다. 한 번만 요청하도록 시장별로 묶는다.
const highlightRequests = new Map<string, Promise<MarketHighlight[]>>();
const loadHighlights = (marketId: string) => {
  let request = highlightRequests.get(marketId);
  if (!request) {
    request = fetch(`/api/markets/${encodeURIComponent(marketId)}/highlights`)
      .then((response) => response.ok ? response.json() as Promise<{ highlights: MarketHighlight[] }> : { highlights: [] })
      .catch(() => ({ highlights: [] }))
      .then(({ highlights }) => highlights);
    highlightRequests.set(marketId, request);
  }
  return request;
};

function useMarketHighlights(marketId: string, initialHighlights?: MarketHighlight[]): MarketHighlight[] | null {
  const [loaded, setLoaded] = useState<{ marketId: string; highlights: MarketHighlight[] } | null>(
    initialHighlights ? { marketId, highlights: initialHighlights } : null,
  );
  useEffect(() => {
    if (initialHighlights) return;
    let cancelled = false;
    loadHighlights(marketId).then((highlights) => { if (!cancelled) setLoaded({ marketId, highlights }); });
    return () => { cancelled = true; };
  }, [initialHighlights, marketId]);
  return loaded?.marketId === marketId ? loaded.highlights : null;
}

type OpenSheet = { category: HighlightCategoryCode | null; source: SubmissionSource } | null;

type MarketDayContext = { kind: "today" | "yesterday"; marketDay: string } | null;

const getMarketDayContext = (market: Pick<PublicMarket, "id" | "name" | "schedule">, today: Date): MarketDayContext => {
  if (market.schedule.kind !== "digit-pair") return null;
  if (getMarketDates(market, { start: today, end: today }).length > 0) return { kind: "today", marketDay: toIsoDate(today) };
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (getMarketDates(market, { start: yesterday, end: yesterday }).length > 0) return { kind: "yesterday", marketDay: toIsoDate(yesterday) };
  return null;
};

const contextDismissKey = (marketId: string) => `${CONTEXT_DISMISS_KEY}:${marketId}`;
/** 처음 펼쳐 보여 주는 이야기 수. 나머지는 "모두 보기"로 연다(HTML에는 남겨 검색에 보인다). */
const VISIBLE_STORIES = 2;

interface MarketHighlightsProps {
  market: Pick<PublicMarket, "id" | "name" | "schedule">;
  scheduleLabel: string;
  /** 서버에서 그릴 때 넘긴다. 없으면 지도 패널처럼 열 때 읽어 온다. */
  initialHighlights?: MarketHighlight[];
  /** false면 제보 버튼을 숨긴다 (서버에 슬랙·DB 설정이 없을 때). */
  submissionsEnabled?: boolean;
  /** 제보를 마친 뒤 "같은 지역 다른 장도 아시나요?"로 보여 줄 시장. */
  nearbyMarkets?: HighlightMarketRef[];
  /** 지도의 "새 이야기"로 들어왔으면 그 항목 이름. 섹션으로 스크롤하고 항목을 강조한다. */
  focusName?: string;
  headingLevel?: 2 | 3;
}

/**
 * 다음 장날 바로 아래의 "방문자가 알려 준 것" 블록과 제보 시트.
 * 이야기는 최근 순으로 두 개만 펼치고, 장날 당일·다음 날에는 "다녀오셨나요?"를 먼저 묻는다.
 */
export function MarketHighlights({ market, scheduleLabel, initialHighlights, submissionsEnabled = false, nearbyMarkets, focusName, headingLevel = 2 }: MarketHighlightsProps) {
  const highlights = useMarketHighlights(market.id, initialHighlights);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [context, setContext] = useState<MarketDayContext>(null);
  const [expanded, setExpanded] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headingId = useId();
  const hasFocus = Boolean(focusName && highlights?.some((item) => item.name === focusName));
  useEffect(() => {
    if (hasFocus) sectionRef.current?.scrollIntoView({ block: "start" });
  }, [hasFocus]);
  // 날짜는 브라우저에서 정한다. 서버에서 그린 페이지가 캐시돼도 오늘 기준으로 보인다.
  useEffect(() => {
    if (!submissionsEnabled) return;
    const next = getMarketDayContext(market, getKoreaCalendarDate(new Date()));
    setContext(next && readStorage(contextDismissKey(market.id)) !== next.marketDay ? next : null);
  }, [market, submissionsEnabled]);

  if (!highlights || (highlights.length === 0 && !submissionsEnabled)) return null;

  const Heading = headingLevel === 2 ? "h2" : "h3";
  const stories = [...highlights].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const focusIndex = stories.findIndex((item) => item.name === focusName);
  const showAll = expanded || focusIndex >= VISIBLE_STORIES;
  const open = (category: HighlightCategoryCode | null, source: SubmissionSource, target: HTMLElement) => {
    returnFocusRef.current = target;
    setSheet({ category, source });
  };
  const chips = (source: SubmissionSource) => CATEGORIES.map((code) => (
    <button key={code} type="button" className={styles.quietChip} aria-label={`${HIGHLIGHT_CATEGORY_LABELS[code]} 알려 주기`} onClick={(event) => open(code, source, event.currentTarget)}>
      <Icon name={CATEGORY_ICONS[code]} />{HIGHLIGHT_CATEGORY_LABELS[code]}
    </button>
  ));

  return (
    <section ref={sectionRef} id={SECTION_ID} className={styles.section} aria-labelledby={headingId}>
      <div className={styles.head}>
        <Heading id={headingId} className={styles.title}>방문자가 알려 준 것</Heading>
        {stories.length > 0 ? <span className={styles.source}>방문자 제보 · 운영자 확인</span> : null}
      </div>
      {context ? (
        <div className={`${styles.context} ${context.kind === "yesterday" ? styles.contextQuiet : ""}`} role="group" aria-labelledby={`${SECTION_ID}-context`}>
          <button type="button" className={styles.contextClose} aria-label="닫기" onClick={() => {
            writeStorage(contextDismissKey(market.id), context.marketDay);
            track("highlight_context_dismiss", { day: context.kind });
            setContext(null);
          }}><Icon name="close" /></button>
          <p id={`${SECTION_ID}-context`} className={styles.contextTitle}>{context.kind === "today" ? "오늘 장날이에요" : "어제 장날 다녀오셨나요?"}</p>
          <p className={styles.contextBody}>{context.kind === "today" ? "다녀오셨다면 좋았던 걸 하나만 알려 주세요" : "기억나는 걸 하나만 알려 주세요"}</p>
          <div className={styles.contextChips}>{chips("context")}</div>
        </div>
      ) : null}
      {stories.length > 0 ? (
        <>
          <ul className={styles.items}>
            {stories.map((item, index) => (
              <li key={item.name} hidden={!showAll && index >= VISIBLE_STORIES} className={item.name === focusName ? styles.focused : undefined} aria-current={item.name === focusName ? "true" : undefined}>
                <span className={styles.categoryIcon} aria-hidden="true"><Icon name={CATEGORY_ICONS[item.category]} /></span>
                <span>
                  <span className={styles.what}>{item.name}{item.name === focusName ? <span className={styles.newTag}>새 이야기</span> : null}</span>
                  <span className={styles.visuallyHidden}>{HIGHLIGHT_CATEGORY_LABELS[item.category]}</span>
                  {item.description ? <span className={styles.description}>{item.description}</span> : null}
                </span>
              </li>
            ))}
          </ul>
          {!showAll && stories.length > VISIBLE_STORIES ? (
            <button type="button" className={styles.showAll} onClick={() => {
              track("story_block_more", { count: String(stories.length) });
              setExpanded(true);
            }}>모두 보기 {stories.length}<Icon name="more" className={styles.chevron} /></button>
          ) : null}
          {submissionsEnabled && !context ? (
            <div className={styles.more} role="group" aria-label="나도 알려 주기">
              <span className={styles.moreLabel} aria-hidden="true">나도 알려 주기</span>
              <div className={styles.quietChips}>{chips(hasFocus ? "latest" : "more_chip")}</div>
            </div>
          ) : null}
        </>
      ) : !context ? (
        <>
          <p className={styles.question}><Icon name="chat" />이 장 첫 이야기를 남겨 주세요</p>
          <div className={styles.quietChips}>{chips("section_chip")}</div>
        </>
      ) : null}
      {sheet ? (
        <HighlightSubmissionSheet
          market={{ id: market.id, name: market.name, scheduleLabel }}
          initialCategory={sheet.category}
          source={sheet.source}
          nearbyMarkets={nearbyMarkets}
          onClose={() => { setSheet(null); returnFocusRef.current?.focus(); }}
        />
      ) : null}
    </section>
  );
}

/** 하단 시트 틀. 포커스를 시트 안에 가두고 Escape로 이 시트만 닫는다. */
export function SheetOverlay({ labelledBy, onClose, className, children }: { labelledBy: string; onClose: () => void; className?: string; children: ReactNode }) {
  // 모바일 키보드가 올라오면 iOS는 fixed 레이어를 줄이지 않아 시트가 키보드 뒤로 숨는다. 보이는 영역(visualViewport)에 맞춘다.
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const visual = window.visualViewport;
    if (!visual) return;
    const update = () => setViewport({ top: visual.offsetTop, height: visual.height });
    update();
    visual.addEventListener("resize", update);
    visual.addEventListener("scroll", update);
    return () => {
      visual.removeEventListener("resize", update);
      visual.removeEventListener("scroll", update);
    };
  }, []);

  // 지도 패널 시트도 document에서 Escape를 들어 패널을 닫는다. 캡처 단계에서 먼저 받아 이 시트만 닫는다.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener("keydown", handleEscape, true);
    return () => document.removeEventListener("keydown", handleEscape, true);
  }, [onClose]);

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([tabindex='-1']), textarea, iframe"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return createPortal(
    <div className={styles.overlay} style={viewport ? { top: viewport.top, bottom: "auto", height: viewport.height } : undefined} onKeyDown={trapFocus}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={className ? `${styles.sheet} ${className}` : styles.sheet} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className={styles.grabber} aria-hidden="true" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

type SheetState =
  | { kind: "editing" }
  | { kind: "sending" }
  | { kind: "done"; name: string; category: HighlightCategoryCode }
  | { kind: "error"; reason: "duplicate" | "retry" | "rate_limit" | "invalid"; message?: string };

const BANNERS: Record<Exclude<Extract<SheetState, { kind: "error" }>["reason"], "invalid">, { title: string; body: string }> = {
  duplicate: { title: "이미 등록됐거나 검토 중인 내용이에요", body: "같은 시장에 같은 제보가 있어요. 다른 걸 알려 주시거나 이대로 닫아 주세요." },
  retry: { title: "잠시 후 다시 시도해 주세요", body: "지금은 보내지 못했어요. 입력한 내용은 그대로 남아 있어요." },
  rate_limit: { title: "잠시 후 다시 보내 주세요", body: "짧은 시간에 제보가 많이 왔어요. 입력한 내용은 그대로 남아 있어요." },
};

interface HighlightSubmissionSheetProps {
  market: HighlightMarketRef;
  initialCategory?: HighlightCategoryCode | null;
  source: SubmissionSource;
  nearbyMarkets?: HighlightMarketRef[];
  /** 지도에서 장을 골라 들어온 경우 "바꾸기"로 다시 고르게 한다. */
  onChangeMarket?: () => void;
  onClose: () => void;
}

export function HighlightSubmissionSheet({ market: initialMarket, initialCategory = null, source: initialSource, nearbyMarkets = [], onChangeMarket, onClose }: HighlightSubmissionSheetProps) {
  const [market, setMarket] = useState(initialMarket);
  const [source, setSource] = useState(initialSource);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HighlightCategoryCode | null>(initialCategory);
  const [description, setDescription] = useState("");
  const [gotcha, setGotcha] = useState("");
  const [state, setState] = useState<SheetState>({ kind: "editing" });
  const nameRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const categoryLabelId = useId();

  useEffect(() => {
    track("specialty_form_open", initialCategory ? { source: initialSource, category: initialCategory } : { source: initialSource });
  }, [initialCategory, initialSource]);
  // 처음 열 때와 "같은 지역 다른 장"으로 이어 쓸 때 "무엇"에 커서를 둔다.
  useEffect(() => { nameRef.current?.focus(); }, [market.id]);
  useEffect(() => { if (state.kind === "done") closeRef.current?.focus(); }, [state.kind]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !category || state.kind === "sending") return;
    setState({ kind: "sending" });
    let reason: Extract<SheetState, { kind: "error" }>["reason"] = "retry";
    let message: string | undefined;
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ market_id: market.id, name, category, description, _gotcha: gotcha }),
      });
      if (response.ok) {
        track("specialty_submit_success", { category, source });
        setState({ kind: "done", name: name.trim(), category });
        return;
      }
      const body = await response.json().catch(() => ({})) as { reason?: string; message?: string };
      if (body.reason === "duplicate" || body.reason === "rate_limit" || body.reason === "invalid") reason = body.reason;
      message = body.message;
    } catch {
      reason = "retry";
    }
    track("specialty_submit_error", { reason: reason === "retry" ? "server" : reason, source });
    setState({ kind: "error", reason, message });
  }

  const continueWith = (next: HighlightMarketRef) => {
    track("specialty_form_open", { source: "followup" });
    setMarket(next);
    setSource("followup");
    setName("");
    setCategory(null);
    setDescription("");
    setState({ kind: "editing" });
  };

  const banner = state.kind === "error"
    ? state.reason === "invalid" ? { title: "입력한 내용을 확인해 주세요", body: state.message ?? "" } : BANNERS[state.reason]
    : null;
  const sending = state.kind === "sending";
  const followUps = nearbyMarkets.filter((candidate) => candidate.id !== market.id).slice(0, 3);

  return (
    <SheetOverlay labelledBy={titleId} onClose={onClose}>
      <div className={styles.sheetHead}>
        <div>
          <h2 id={titleId} className={state.kind === "done" ? styles.visuallyHidden : undefined}>이 장에 대해 알려 주기</h2>
          <span className={styles.market}>
            <Icon name="pin" /><strong>{market.name}</strong>{state.kind === "done" ? null : ` · ${market.scheduleLabel}`}
            {onChangeMarket && state.kind !== "done" ? <button type="button" className={styles.swap} onClick={onChangeMarket}>바꾸기</button> : null}
          </span>
        </div>
        <button type="button" className={styles.iconButton} aria-label="닫기" onClick={onClose}><Icon name="close" /></button>
      </div>

      {state.kind === "done" ? (
        <>
          <div className={styles.done} role="status">
            <div className={styles.doneBadge}><Icon name="check" /></div>
            <p className={styles.doneTitle}>보냈어요</p>
            <p>운영자가 확인하면 이 장에 올라가요.</p>
            <div className={styles.preview}>
              <p className={styles.previewLabel}>올라가면 이렇게 보여요</p>
              <span className={`map-marker ${styles.previewMarker}`} aria-hidden="true"><Icon name="chat" className="map-marker-story" /><span>{market.name}</span></span>
              <div className={styles.sent}>
                <Icon name={CATEGORY_ICONS[state.category]} />
                <div><div className={styles.what}>{state.name}</div><div className={styles.meta}>{HIGHLIGHT_CATEGORY_LABELS[state.category]} · {market.name}</div></div>
              </div>
            </div>
          </div>
          {followUps.length > 0 ? (
            <div className={styles.followUp}>
              <p className={styles.followUpTitle}>같은 지역 다른 장도 아시나요?</p>
              <p className={styles.followUpHint}>아는 곳을 누르면 바로 이어서 쓸 수 있어요</p>
              <ul>
                {followUps.map((candidate) => (
                  <li key={candidate.id}>
                    <button type="button" className={styles.followUpRow} onClick={() => continueWith(candidate)}>
                      <span><strong>{candidate.name}</strong><span>{candidate.scheduleLabel}</span></span><Icon name="more" className={styles.chevron} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button ref={closeRef} type="button" className={styles.tonal} onClick={onClose}>닫기</button>
        </>
      ) : (
        <form onSubmit={submit} noValidate>
          {banner ? <div className={styles.banner} role="alert"><Icon name="alert" /><p><strong>{banner.title}</strong>{banner.body}</p></div> : null}
          <div className={styles.field}>
            <label className={styles.label} htmlFor={nameId}>무엇 <span className={styles.tag}>필수</span></label>
            <input ref={nameRef} id={nameId} className={styles.input} maxLength={HIGHLIGHT_NAME_MAX} placeholder={NAME_PLACEHOLDERS[category ?? "specialty"]} value={name} onChange={(event) => setName(event.target.value)} required />
            <div className={styles.hint}><span>품목, 음식, 장소 이름처럼 짧게</span><span className={styles.counter}>{name.length}/{HIGHLIGHT_NAME_MAX}</span></div>
          </div>
          <div className={styles.field} role="radiogroup" aria-labelledby={categoryLabelId} aria-required="true">
            <div className={styles.label} id={categoryLabelId}>카테고리 <span className={styles.tag}>필수 · 하나 선택</span></div>
            <div className={styles.chips}>
              {CATEGORIES.map((code) => (
                <button key={code} type="button" role="radio" aria-checked={category === code} className={styles.chip} onClick={() => setCategory(code)}>
                  <Icon name={CATEGORY_ICONS[code]} />{HIGHLIGHT_CATEGORY_LABELS[code]}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={descriptionId}>한 줄 설명 <span className={styles.tag}>선택</span></label>
            <textarea id={descriptionId} className={styles.textarea} maxLength={HIGHLIGHT_DESCRIPTION_MAX} placeholder="예: 3월에 많이 나오고 싸요" value={description} onChange={(event) => setDescription(event.target.value)} />
            <div className={styles.hint}><span>이름·연락처 같은 개인정보는 적지 말아 주세요</span><span className={styles.counter}>{description.length}/{HIGHLIGHT_DESCRIPTION_MAX}</span></div>
          </div>
          <input className={styles.visuallyHidden} tabIndex={-1} autoComplete="off" aria-hidden="true" name="_gotcha" value={gotcha} onChange={(event) => setGotcha(event.target.value)} />
          <button type="submit" className={styles.primary} disabled={sending || !name.trim() || !category}>
            {sending ? "보내는 중…" : state.kind === "error" && state.reason === "retry" ? "다시 보내기" : "보내기"}
          </button>
          <p className={styles.note}><Icon name="shield" />운영자가 확인한 뒤 올라가요</p>
        </form>
      )}
    </SheetOverlay>
  );
}
