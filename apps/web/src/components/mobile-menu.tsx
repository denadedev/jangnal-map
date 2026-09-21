"use client";

import { useEffect, useRef } from "react";

export interface MobileMenuProps {
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
  open,
  onClose,
  installAction,
  installPlatform = null,
  iosGuide = false,
  onShowIosGuide,
  onDismissInstall,
}: MobileMenuProps) {
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
        aria-label="보조 메뉴"
        tabIndex={-1}
      >
        <div className="mobile-menu-heading">
          <strong>오늘 장날</strong>
          <button type="button" className="mobile-menu-close" aria-label="메뉴 닫기" onClick={onClose}>×</button>
        </div>
        <nav aria-label="보조 메뉴">
          <a className="mobile-menu-link" href="/onnuri">온누리상품권</a>
          <a className="mobile-menu-link" href="/report?kind=service">불편 신고</a>
          <a className="mobile-menu-link" href="/privacy">개인정보 안내</a>
        </nav>
        {installPlatform ? (
          <div className="mobile-menu-install">
            <strong>홈 화면에 추가</strong>
            <p>장날을 앱처럼 빠르게 확인할 수 있어요.</p>
            {iosGuide ? <p className="mobile-menu-install-guide">Safari의 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.</p> : null}
            {installPlatform === "android" ? (
              <button type="button" className="mobile-menu-install-action" onClick={() => void installAction?.()}>추가하기</button>
            ) : (
              <button type="button" className="mobile-menu-install-action" onClick={onShowIosGuide}>추가 방법</button>
            )}
            <button type="button" className="mobile-menu-dismiss" onClick={onDismissInstall}>14일 동안 닫기</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
