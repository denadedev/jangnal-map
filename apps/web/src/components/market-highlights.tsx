"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

import { HIGHLIGHT_CATEGORY_LABELS, type HighlightCategoryCode } from "../db/codes";
import { HIGHLIGHT_DESCRIPTION_MAX, HIGHLIGHT_NAME_MAX } from "../lib/highlight-submission";
import type { MarketHighlight } from "../lib/market-highlight";
import { Icon, type IconName } from "./icon";
import styles from "./market-highlights.module.css";

const CATEGORY_ICONS: Record<HighlightCategoryCode, IconName> = { specialty: "sprout", food: "bowl", tip: "bulb", sight: "star" };
const CATEGORIES = Object.keys(HIGHLIGHT_CATEGORY_LABELS) as HighlightCategoryCode[];

type WindowWithUmami = Window & { umami?: { track: (event: string, data?: Record<string, string>) => void } };

const track = (event: string, data?: Record<string, string>) => (window as WindowWithUmami).umami?.track(event, data);

interface MarketHighlightsProps {
  marketId: string;
  marketName: string;
  scheduleLabel: string;
  /** 서버에서 그릴 때 넘긴다. 없으면 지도 패널처럼 열 때 읽어 온다. */
  initialHighlights?: MarketHighlight[];
  /** false면 제보 버튼을 숨긴다 (서버에 슬랙·DB 설정이 없을 때). */
  submissionsEnabled?: boolean;
  headingLevel?: 2 | 3;
}

/** 시장 상세·지도 패널의 "방문자가 알려 준 것" 섹션과 제보 시트. */
export function MarketHighlights({ marketId, marketName, scheduleLabel, initialHighlights, submissionsEnabled = false, headingLevel = 2 }: MarketHighlightsProps) {
  const [loaded, setLoaded] = useState<{ marketId: string; highlights: MarketHighlight[] } | null>(
    initialHighlights ? { marketId, highlights: initialHighlights } : null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (initialHighlights) return;
    let cancelled = false;
    fetch(`/api/markets/${encodeURIComponent(marketId)}/highlights`)
      .then((response) => response.ok ? response.json() as Promise<{ highlights: MarketHighlight[] }> : { highlights: [] })
      .catch(() => ({ highlights: [] }))
      .then(({ highlights }) => { if (!cancelled) setLoaded({ marketId, highlights }); });
    return () => { cancelled = true; };
  }, [initialHighlights, marketId]);

  const highlights = loaded?.marketId === marketId ? loaded.highlights : null;
  if (!highlights || (highlights.length === 0 && !submissionsEnabled)) return null;

  const Heading = headingLevel === 2 ? "h2" : "h3";
  const Sub = headingLevel === 2 ? "h3" : "h4";
  const groups = CATEGORIES.map((category) => ({ category, items: highlights.filter((item) => item.category === category) }))
    .filter((group) => group.items.length > 0);

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <Heading id={headingId} className={styles.title}>방문자가 알려 준 것</Heading>
      {groups.length > 0 ? (
        <>
          <span className={styles.source}><Icon name="person" />방문자 제보 · 운영자 확인</span>
          {groups.map(({ category, items }) => (
            <div key={category} className={styles.category}>
              <div className={styles.categoryHead}>
                <span className={styles.categoryIcon}><Icon name={CATEGORY_ICONS[category]} /></span>
                <Sub>{HIGHLIGHT_CATEGORY_LABELS[category]}</Sub>
                <span className={styles.count}>{items.length}</span>
              </div>
              <ul className={styles.items}>
                {items.map((item) => (
                  <li key={item.name}>
                    <span className={styles.what}>{item.name}</span>
                    {item.description ? <span className={styles.description}>{item.description}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      ) : (
        <p className={styles.empty}><strong>아직 올라온 이야기가 없어요.</strong>이 장에서 산 것, 먹은 것, 알아 두면 좋은 걸 한 줄로 알려 주세요.</p>
      )}
      {submissionsEnabled ? (
        <button ref={openButtonRef} type="button" className={styles.tonal} onClick={() => { setSheetOpen(true); track("specialty_form_open"); }}>
          <Icon name="pen" />이 장에 대해 알려 주기
        </button>
      ) : null}
      {sheetOpen ? (
        <SubmissionSheet
          marketId={marketId}
          marketName={marketName}
          scheduleLabel={scheduleLabel}
          onClose={() => { setSheetOpen(false); openButtonRef.current?.focus(); }}
        />
      ) : null}
    </section>
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

function SubmissionSheet({ marketId, marketName, scheduleLabel, onClose }: {
  marketId: string;
  marketName: string;
  scheduleLabel: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HighlightCategoryCode | null>(null);
  const [description, setDescription] = useState("");
  const [gotcha, setGotcha] = useState("");
  const [state, setState] = useState<SheetState>({ kind: "editing" });
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const nameId = useId();
  const descriptionId = useId();
  const categoryLabelId = useId();

  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => { if (state.kind === "done") closeRef.current?.focus(); }, [state.kind]);

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
        body: JSON.stringify({ market_id: marketId, name, category, description, _gotcha: gotcha }),
      });
      if (response.ok) {
        track("specialty_submit_success", { category });
        setState({ kind: "done", name: name.trim(), category });
        return;
      }
      const body = await response.json().catch(() => ({})) as { reason?: string; message?: string };
      if (body.reason === "duplicate" || body.reason === "rate_limit" || body.reason === "invalid") reason = body.reason;
      message = body.message;
    } catch {
      reason = "retry";
    }
    track("specialty_submit_error", { reason: reason === "retry" ? "server" : reason });
    setState({ kind: "error", reason, message });
  }

  const banner = state.kind === "error"
    ? state.reason === "invalid" ? { title: "입력한 내용을 확인해 주세요", body: state.message ?? "" } : BANNERS[state.reason]
    : null;
  const sending = state.kind === "sending";

  return createPortal(
    <div className={styles.overlay} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([tabindex='-1']), textarea, iframe"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.grabber} aria-hidden="true" />
        <div className={styles.sheetHead}>
          <div>
            <h2 id={titleId} className={state.kind === "done" ? styles.visuallyHidden : undefined}>이 장에 대해 알려 주기</h2>
            <span className={styles.market}><Icon name="pin" /><strong>{marketName}</strong>{state.kind === "done" ? null : ` · ${scheduleLabel}`}</span>
          </div>
          <button type="button" className={styles.iconButton} aria-label="닫기" onClick={onClose}><Icon name="close" /></button>
        </div>

        {state.kind === "done" ? (
          <>
            <div className={styles.done} role="status">
              <div className={styles.doneBadge}><Icon name="check" /></div>
              <p className={styles.doneTitle}>보냈어요</p>
              <p>검토 후 반영돼요.<br />운영자가 확인하면 이 장 정보에 올라가요.</p>
              <div className={styles.sent}>
                <Icon name={CATEGORY_ICONS[state.category]} />
                <div><div className={styles.what}>{state.name}</div><div className={styles.meta}>{HIGHLIGHT_CATEGORY_LABELS[state.category]} · {marketName}</div></div>
              </div>
            </div>
            <button ref={closeRef} type="button" className={styles.tonal} onClick={onClose}>닫기</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            {banner ? <div className={styles.banner} role="alert"><Icon name="alert" /><p><strong>{banner.title}</strong>{banner.body}</p></div> : null}
            <div className={styles.field}>
              <label className={styles.label} htmlFor={nameId}>무엇 <span className={styles.tag}>필수</span></label>
              <input ref={nameRef} id={nameId} className={styles.input} maxLength={HIGHLIGHT_NAME_MAX} placeholder="예: 미나리" value={name} onChange={(event) => setName(event.target.value)} required />
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
              <div className={styles.hint}><span /><span className={styles.counter}>{description.length}/{HIGHLIGHT_DESCRIPTION_MAX}</span></div>
            </div>
            <input className={styles.visuallyHidden} tabIndex={-1} autoComplete="off" aria-hidden="true" name="_gotcha" value={gotcha} onChange={(event) => setGotcha(event.target.value)} />
            <button type="submit" className={styles.primary} disabled={sending || !name.trim() || !category}>
              {sending ? "보내는 중…" : state.kind === "error" && state.reason === "retry" ? "다시 보내기" : "보내기"}
            </button>
            <p className={styles.note}><Icon name="shield" />운영자가 확인한 뒤 올라가요</p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
