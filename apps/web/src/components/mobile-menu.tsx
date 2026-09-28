"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

export interface MobileMenuProps {
  locale?: Locale;
  languageSwitchHref?: string;
  open: boolean;
  onClose: () => void;
  installAction?: (() => void | Promise<void>) | null;
  installPlatform?: "android" | "ios" | null;
  iosGuide?: boolean;
  onShowIosGuide?: () => void;
  onDismissInstall?: () => void;
}

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
  installAction,
  installPlatform = null,
  iosGuide = false,
  onShowIosGuide,
  onDismissInstall,
}: MobileMenuProps) {
  const ui = getUiCopy(locale);
  const dialogRef = useRef<HTMLDivElement>(null);

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
          <strong>{ui.brand}</strong>
          <button type="button" className="mobile-menu-close" aria-label={ui.closeMenu} onClick={onClose}>×</button>
        </div>
        <nav aria-label={ui.menu}>
          <a className="mobile-menu-link" href="/en">{locale === "en" ? "Market-day guide" : "English guide"}</a>
          <a className="mobile-menu-link" href="/onnuri">{ui.onnuri}</a>
          <a className="mobile-menu-link" href="/report?kind=service">{ui.report}</a>
          <a className="mobile-menu-link" href="https://legal-hub.denadedev.workers.dev/kmarketday/privacy/">{ui.privacy}</a>
          <a className="mobile-menu-link" href="https://legal-hub.denadedev.workers.dev/kmarketday/terms/">{ui.terms}</a>
          <a className="mobile-menu-link" href="/about">{ui.about}</a>
          <a className="mobile-menu-link" href="/about#data-policy">{ui.dataPolicy}</a>
          <a className="mobile-menu-link" href={languageSwitchHref ?? (locale === "en" ? "/" : "/en/map")}>{locale === "en" ? "한국어" : "English map"}</a>
        </nav>
        {installPlatform ? (
          <div className="mobile-menu-install">
            <strong>{ui.installTitle}</strong>
            <p>{ui.installDescription}</p>
            {iosGuide ? <p className="mobile-menu-install-guide">{ui.installIosGuide}</p> : null}
            {installPlatform === "android" ? (
              <button type="button" className="mobile-menu-install-action" onClick={() => void installAction?.()}>{ui.add}</button>
            ) : (
              <button type="button" className="mobile-menu-install-action" onClick={onShowIosGuide}>{ui.addHow}</button>
            )}
            <button type="button" className="mobile-menu-dismiss" onClick={onDismissInstall}>{ui.dismissInstall}</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
