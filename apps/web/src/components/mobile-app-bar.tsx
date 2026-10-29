"use client";

import { useState } from "react";

import { useInstallPrompt } from "./install-prompt";
import { InstallGuideSheet } from "./install-ui";
import { MapLinkButton } from "./map-link-button";
import { MobileMenu } from "./mobile-menu";
import type { MobileMenuProps } from "./mobile-menu";
import { BrandMark, Icon } from "./icon";

export interface MobileAppBarProps {
  title?: string;
  backHref?: string;
  /** backHref가 지도 쿼리 주소일 때 크롤러에 링크로 보이지 않게 버튼으로 그린다. */
  backAsButton?: boolean;
  homeHref?: string;
  onMenuOpen?: () => void;
  menuProps?: Omit<MobileMenuProps, "open" | "onClose">;
}

export function MobileAppBar({ title = "오늘 장날", backHref, backAsButton = false, homeHref = "/", onMenuOpen, menuProps }: MobileAppBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const installPrompt = useInstallPrompt();
  const openMenu = () => {
    onMenuOpen?.();
    setMenuOpen(true);
  };

  return (
    <>
      <header className="mobile-app-bar">
        {backHref && backAsButton ? (
          <MapLinkButton className="mobile-app-bar-back" href={backHref} aria-label="이전 화면"><Icon name="back" /></MapLinkButton>
        ) : backHref ? (
          <a className="mobile-app-bar-back" href={backHref} aria-label="이전 화면"><Icon name="back" /></a>
        ) : null}
        <a className="mobile-app-bar-brand" href={homeHref} aria-label="오늘 장날 홈">
          <span className="mobile-app-bar-mark" aria-hidden="true"><BrandMark /></span>
          <span>{title}</span>
        </a>
        <button
          ref={(element) => {
            if (element && !menuOpen) element.dataset.menuTrigger = "true";
          }}
          type="button"
          className="mobile-app-bar-menu"
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu-dialog"
          onClick={openMenu}
        >
          <Icon name="menu" />
        </button>
      </header>
      <MobileMenu {...menuProps} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <InstallGuideSheet install={installPrompt} />
    </>
  );
}
