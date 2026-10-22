"use client";

import { useEffect, useRef, useState } from "react";
import { formatPatternLabel, getPatternForDate } from "../lib/jangnal-dates";
import { getKoreaCalendarDate } from "../lib/korea-date";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";
import { Icon } from "./icon";
import { trackEvent } from "./install-prompt";
import { AppIcon } from "./install-ui";

export interface MobileMenuProps {
  locale?: Locale;
  languageSwitchHref?: string;
  open: boolean;
  onClose: () => void;
  /** 있으면 "다녀온 장 이야기 들려주기"를 보여 준다. 시장 목록이 있는 홈 지도에서만 넘긴다. */
  onParticipate?: () => void;
}

const TOAST_DURATION_MS = 2400;

const getFocusable = (container: HTMLElement): HTMLElement[] => Array.from(
  container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ),
);

export function MobileMenu({
  locale = "ko",
  languageSwitchHref,
  open,
  onClose,
  onParticipate,
}: MobileMenuProps) {
  const ui = getUiCopy(locale);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = getFocusable(dialog);
    focusables[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const currentFocusables = getFocusable(dialog);
      if (currentFocusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = currentFocusables[0];
      const last = currentFocusables[currentFocusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
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
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  // 메뉴는 연 뒤에만 그려져 서버 렌더와 날짜가 어긋나지 않는다.
  const today = getKoreaCalendarDate(new Date());
  const todayDigits = formatPatternLabel(getPatternForDate(today)).replace("일장", "");
  const dateLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(today);
  const otherLanguageHref = languageSwitchHref ?? (locale === "en" ? "/" : "/en/map");

  const share = async () => {
    const url = `${window.location.origin}${locale === "en" ? "/en/map" : "/"}`;
    const text = locale === "en"
      ? `${ui.menuToday} a ${todayDigits} ${ui.menuTodaySuffix}. ${ui.menuShareText}`
      : `${ui.menuToday} ${todayDigits}${ui.menuTodaySuffix}이에요. ${ui.menuShareText}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: ui.brand, text, url });
        trackEvent("menu-share", { method: "native" });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      trackEvent("menu-share", { method: "copy" });
      setToast({ message: ui.copySucceeded, isError: false });
    } catch {
      setToast({ message: ui.copyFailed, isError: true });
    }
  };

  return (
    <div className="mobile-menu-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <div
        ref={dialogRef}
        id="mobile-menu-dialog"
        className="mobile-menu-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={ui.menu}
        tabIndex={-1}
      >
        <div className="mobile-menu-heading">
          <span className="mobile-menu-brand"><AppIcon size={36} /><strong>{ui.brand}</strong></span>
          <button type="button" className="mobile-menu-close" aria-label={ui.closeMenu} onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="mobile-menu-today">
          <p>{dateLabel}</p>
          <p className="mobile-menu-today-line">
            {ui.menuToday} <span className="jn mobile-menu-today-digits">{todayDigits}</span> {ui.menuTodaySuffix}
          </p>
        </div>
        <div className="mobile-menu-body">
          <button type="button" className="mobile-menu-share" onClick={() => void share()}>
            <Icon name="share" />{ui.menuShare}
          </button>
          <nav aria-label={ui.menu}>
            <div className="mobile-menu-group">
              {locale === "ko"
                ? <a className="mobile-menu-link" href="/jangnal"><Icon name="pin" /><span>지역별 장날</span><Icon name="more" className="mobile-menu-chevron" /></a>
                : <a className="mobile-menu-link" href="/en"><Icon name="map" /><span>Market-day guide</span><Icon name="more" className="mobile-menu-chevron" /></a>}
              <a className="mobile-menu-link" href="/onnuri"><Icon name="ticket" /><span>{ui.onnuri}</span><Icon name="more" className="mobile-menu-chevron" /></a>
            </div>
            <div className="mobile-menu-group">
              {onParticipate ? (
                <button type="button" className="mobile-menu-link" onClick={onParticipate}><Icon name="chat" /><span>{ui.menuStory}</span><Icon name="more" className="mobile-menu-chevron" /></button>
              ) : null}
              <a className="mobile-menu-link" href="/report?kind=service"><Icon name="flag" /><span>{ui.report}</span><Icon name="more" className="mobile-menu-chevron" /></a>
            </div>
          </nav>
        </div>
        <div className="mobile-menu-foot">
          <nav className="mobile-menu-policy" aria-label={ui.about}>
            <a href="/about">{ui.about}</a>
            <a href="/terms">{ui.terms}</a>
            <a href="/about#data-policy">{ui.dataPolicy}</a>
            <a href="/privacy">{ui.privacy}</a>
          </nav>
          <div className="mobile-menu-language" role="group" aria-label={ui.language}>
            {locale === "ko"
              ? <><span aria-current="true">한국어</span><a href={otherLanguageHref} lang="en">English</a></>
              : <><a href={otherLanguageHref} lang="ko">한국어</a><span aria-current="true">English</span></>}
          </div>
        </div>
        {toast ? <p className="mobile-menu-toast" role={toast.isError ? "alert" : "status"}>{toast.isError ? null : <Icon name="check" />}{toast.message}</p> : null}
      </div>
    </div>
  );
}
