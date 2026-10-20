"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";
import type { InstallPlatform } from "./install-prompt";
import { AppIcon } from "./install-ui";

export interface MobileMenuProps {
  locale?: Locale;
  languageSwitchHref?: string;
  open: boolean;
  onClose: () => void;
  installAction?: (() => void | Promise<void>) | null;
  installPlatform?: InstallPlatform | null;
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
        {installPlatform ? (
          <section className="mobile-menu-install" aria-label={ui.installTitle}>
            <div className="mobile-menu-install-top">
              <AppIcon size={48} />
              <div>
                <strong>{ui.installTitle}</strong>
                <p>{ui.installDescription}</p>
              </div>
            </div>
            <div className="mobile-menu-install-actions">
              <button type="button" className="mobile-menu-install-action" onClick={() => void installAction?.()}>
                {installPlatform === "android" ? ui.add : ui.addHow}
              </button>
              <button type="button" className="mobile-menu-dismiss" onClick={onDismissInstall}>{ui.dismissInstall}</button>
            </div>
          </section>
        ) : null}
        <nav aria-label={ui.menu}>
          <a className="mobile-menu-link" href="/en">{locale === "en" ? "Market-day guide" : "English guide"}</a>
          {locale === "ko" ? <a className="mobile-menu-link" href="/jangnal">지역별 장날</a> : null}
          <a className="mobile-menu-link" href="/onnuri">{ui.onnuri}</a>
          <a className="mobile-menu-link" href="/report?kind=service">{ui.report}</a>
          <a className="mobile-menu-link" href="/privacy">{ui.privacy}</a>
          <a className="mobile-menu-link" href="/terms">{ui.terms}</a>
          <a className="mobile-menu-link" href="/about">{ui.about}</a>
          <a className="mobile-menu-link" href="/about#data-policy">{ui.dataPolicy}</a>
          <a className="mobile-menu-link" href={languageSwitchHref ?? (locale === "en" ? "/" : "/en/map")}>{locale === "en" ? "한국어" : "English map"}</a>
        </nav>
      </div>
    </div>
  );
}
