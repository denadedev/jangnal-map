"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export type SheetSnap = "collapsed" | "half" | "full";
export type SheetMode = "results" | "detail";

export interface MobileMarketSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  mode: SheetMode;
  onModeChange: (mode: SheetMode) => void;
  children: ReactNode;
  title: string;
  describedBy?: string;
}

const snaps: SheetSnap[] = ["collapsed", "half", "full"];

const nextSnap = (snap: SheetSnap, direction: "up" | "down"): SheetSnap => {
  const index = snaps.indexOf(snap);
  const nextIndex = direction === "up" ? Math.min(index + 1, snaps.length - 1) : Math.max(index - 1, 0);
  return snaps[nextIndex];
};

export function MobileMarketSheet({
  snap,
  onSnapChange,
  mode,
  onModeChange,
  children,
  title,
  describedBy,
}: MobileMarketSheetProps) {
  const dragStartY = useRef<number | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const delta = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (Math.abs(delta) < 36) return;
    onSnapChange(nextSnap(snap, delta < 0 ? "up" : "down"));
  };

  const handleMapView = () => {
    onModeChange("results");
    onSnapChange("collapsed");
  };

  return (
    <section
      className={`mobile-market-sheet is-${mode}`}
      data-snap={snap}
      role="region"
      aria-label={title}
      aria-describedby={describedBy}
    >
      <button
        type="button"
        className="mobile-market-sheet-handle"
        aria-label="시트 손잡이"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") onSnapChange(nextSnap(snap, "up"));
          if (event.key === "ArrowDown") onSnapChange(nextSnap(snap, "down"));
        }}
      >
        <span className="mobile-market-sheet-grip" aria-hidden="true" />
      </button>
      <div className="mobile-market-sheet-heading">
        <h2>{title}</h2>
        {mode === "detail" ? (
          <button type="button" className="mobile-market-sheet-map-button" onClick={handleMapView}>지도 보기</button>
        ) : snap === "collapsed" ? (
          <button type="button" className="mobile-market-sheet-expand-button" onClick={() => onSnapChange("half")}>결과 펼치기</button>
        ) : snap === "half" ? (
          <button type="button" className="mobile-market-sheet-expand-button" onClick={() => onSnapChange("full")}>전체 결과 보기</button>
        ) : (
          <button type="button" className="mobile-market-sheet-map-button" onClick={() => onSnapChange("collapsed")}>지도 보기</button>
        )}
      </div>
      <div className="mobile-market-sheet-status" aria-live="polite">
        {mode === "detail" ? "선택한 시장 상세" : snap === "full" ? "전체 시장 결과" : "시장 결과"}
      </div>
      <div className="mobile-market-sheet-content">{children}</div>
    </section>
  );
}
