"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { getKoreaCalendarDate } from "../lib/korea-date";
import type { PublicMarket } from "../lib/market";
import { Icon } from "./icon";
import { SheetOverlay, type SubmissionSource } from "./market-highlights";
import styles from "./market-highlights.module.css";
import { MenuSubmissionFlow } from "./today-highlight-prompt";

type PickerState = { kind: "closed" } | { kind: "loading" } | { kind: "failed" } | { kind: "ready"; markets: PublicMarket[] };

/** "다녀온 장 이야기 들려주기". 시장 목록이 없는 화면에서 누르면 목록을 받아 장 고르기부터 연다.
 * 전국 목록을 받는 데 몇 초 걸릴 수 있어, 누르자마자 시트를 열고 그 안에서 기다리게 한다. */
export function StoryPickerButton({ className, source, children = "다녀온 장 이야기 들려주기" }: { className?: string; source: SubmissionSource; children?: ReactNode }) {
  const [state, setState] = useState<PickerState>({ kind: "closed" });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // 닫은 뒤 늦게 온 응답이 시트를 다시 열지 않게 한다.
  const requestRef = useRef(0);

  const load = async () => {
    const request = ++requestRef.current;
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/markets");
      if (!response.ok) throw new Error(String(response.status));
      const markets = await response.json() as PublicMarket[];
      if (request === requestRef.current) setState({ kind: "ready", markets });
    } catch {
      if (request === requestRef.current) setState({ kind: "failed" });
    }
  };

  const close = () => {
    requestRef.current += 1;
    setState({ kind: "closed" });
    buttonRef.current?.focus();
  };

  return (
    <>
      <button ref={buttonRef} type="button" className={className} onClick={() => void load()}>{children}</button>
      {state.kind === "loading" || state.kind === "failed" ? (
        <SheetOverlay labelledBy={titleId} onClose={close} className={styles.pickerSheet}>
          <div className={styles.sheetHead}>
            <div>
              <h2 id={titleId}>어느 장이었나요?</h2>
              <span className={styles.market} role="status">{state.kind === "loading" ? "시장 목록을 불러오고 있어요" : "시장 목록을 불러오지 못했어요"}</span>
            </div>
            <button type="button" className={styles.iconButton} aria-label="닫기" onClick={close}><Icon name="close" /></button>
          </div>
          {state.kind === "failed" ? <button type="button" className={styles.primary} onClick={() => void load()}>다시 불러오기</button> : null}
        </SheetOverlay>
      ) : null}
      {state.kind === "ready" ? (
        <MenuSubmissionFlow markets={state.markets} today={getKoreaCalendarDate(new Date())} currentLocation={null} source={source} onClose={close} />
      ) : null}
    </>
  );
}
