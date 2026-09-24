"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from "react";

export type SheetSnap = "collapsed" | "half" | "full";
export type SheetMode = "results" | "preview" | "detail";

export interface MobileMarketSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  mode: SheetMode;
  onModeChange: (mode: SheetMode) => void;
  children: ReactNode;
  title: string;
  describedBy?: string;
  contentRef?: RefObject<HTMLDivElement | null>;
  onClose?: () => void;
  onListView?: () => void;
  onPreviewOpenDetail?: () => void;
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
  contentRef,
  onClose,
  onListView,
  onPreviewOpenDetail,
}: MobileMarketSheetProps) {
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const handleClose = useCallback(() => {
    onClose?.();
    if (onClose) return;
    onModeChange("results");
    onSnapChange("collapsed");
  }, [onClose, onModeChange, onSnapChange]);
  const handleOpenPreviewDetail = useCallback(() => {
    if (onPreviewOpenDetail) {
      onPreviewOpenDetail();
      return;
    }
    onModeChange("detail");
    onSnapChange("full");
  }, [onModeChange, onPreviewOpenDetail, onSnapChange]);

  useEffect(() => {
    if (mode === "preview") {
      const handlePreviewKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        handleClose();
      };
      document.addEventListener("keydown", handlePreviewKeyDown);
      return () => document.removeEventListener("keydown", handlePreviewKeyDown);
    }
    if (mode !== "detail" || snap !== "full" || !sheetRef.current) return;
    const sheet = sheetRef.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const backgroundNodes = [".map-stage", ".market-filters", ".mobile-home-controls", ".mobile-app-bar"]
      .map((selector) => document.querySelector<HTMLElement>(selector))
      .filter((element): element is HTMLElement => Boolean(element));
    backgroundNodes.forEach((element) => element.setAttribute("inert", ""));
    sheet.focus();
    const getFocusable = () => Array.from(sheet.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
    ));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        sheet.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === sheet) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      backgroundNodes.forEach((element) => element.removeAttribute("inert"));
      previousActive?.focus();
    };
  }, [handleClose, mode, snap]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragStartY.current === null) return;
    const delta = event.clientY - dragStartY.current;
    dragStartY.current = null;
    if (Math.abs(delta) < 36) return;
    if (mode === "preview") {
      if (delta < 0) handleOpenPreviewDetail();
      else handleClose();
      return;
    }
    onSnapChange(nextSnap(snap, delta < 0 ? "up" : "down"));
  };

  const handleListView = () => {
    if (onListView) {
      onListView();
      return;
    }
    onModeChange("results");
    onSnapChange("full");
  };

  return (
    <section
      ref={sheetRef}
      className={`mobile-market-sheet is-${mode}`}
      data-snap={snap}
      role={mode === "detail" && snap === "full" ? "dialog" : "region"}
      aria-modal={mode === "detail" && snap === "full" ? "true" : undefined}
      tabIndex={mode === "detail" && snap === "full" ? -1 : undefined}
      aria-label={title}
      aria-describedby={describedBy}
    >
      <button
        type="button"
        className="mobile-market-sheet-handle"
        aria-label={mode === "preview" ? "미리보기 펼치기" : "시트 손잡이"}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" && mode === "preview") {
            handleOpenPreviewDetail();
          } else if (event.key === "ArrowDown" && mode === "preview") {
            handleClose();
          } else if (event.key === "ArrowUp") {
            onSnapChange(nextSnap(snap, "up"));
          } else if (event.key === "ArrowDown") {
            onSnapChange(nextSnap(snap, "down"));
          }
        }}
      >
        <span className="mobile-market-sheet-grip" aria-hidden="true" />
      </button>
      {mode === "results" && snap === "collapsed" ? (
        <button
          type="button"
          className="mobile-market-sheet-collapsed-button"
          aria-label="목록 열기"
          aria-describedby={describedBy}
          onClick={() => onSnapChange("half")}
        >
          <strong>{title}</strong>
          <span>목록 열기 <span aria-hidden="true">↑</span></span>
        </button>
      ) : (
        <div className="mobile-market-sheet-heading">
          <h2>{title}</h2>
          {mode === "detail" ? (
            <div className="mobile-market-sheet-heading-actions">
              <button type="button" className="mobile-market-sheet-close-button" onClick={handleClose}>닫기</button>
              <button type="button" className="mobile-market-sheet-list-button" onClick={handleListView}>목록으로</button>
            </div>
          ) : mode === "preview" ? (
            <button type="button" className="mobile-market-sheet-close-button" onClick={handleClose}>닫기</button>
          ) : snap === "half" ? (
            <button type="button" className="mobile-market-sheet-expand-button" onClick={() => onSnapChange("full")}>목록 크게 보기</button>
          ) : (
            <button type="button" className="mobile-market-sheet-map-button" onClick={() => onSnapChange("collapsed")}>지도 보기</button>
          )}
        </div>
      )}
      <div id="mobile-market-sheet-status" className="mobile-market-sheet-status" aria-live="polite">
        {mode === "detail" ? `${title}를 열었습니다` : mode === "preview" ? `${title} 미리보기를 열었습니다` : snap === "full" ? "전체 시장 결과" : title}
      </div>
      <div ref={contentRef} className="mobile-market-sheet-content">{children}</div>
    </section>
  );
}
