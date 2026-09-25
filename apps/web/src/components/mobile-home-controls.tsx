"use client";

import { useState, type RefObject } from "react";

import { MarketFilters, type MarketFiltersProps } from "./market-filters";
import { MobileMenu } from "./mobile-menu";
import { useInstallPrompt } from "./install-prompt";

type MobileHomeControlsProps = Omit<MarketFiltersProps, "mobileMenuControl"> & {
  containerRef?: RefObject<HTMLDivElement | null>;
};

export function MobileHomeControls({ containerRef, ...props }: MobileHomeControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const installPrompt = useInstallPrompt();
  const installMenuProps = {
    installPlatform: installPrompt.platform,
    installAction: installPrompt.platform === "android" ? installPrompt.install : null,
    iosGuide: installPrompt.iosGuide,
    onShowIosGuide: installPrompt.showIosGuide,
    onDismissInstall: installPrompt.dismiss,
  };

  return (
    <>
      <div ref={containerRef} className="mobile-home-controls">
        <MarketFilters
          {...props}
          mobileMenuControl={(
            <button
              type="button"
              className="mobile-app-bar-menu"
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu-dialog"
              onClick={() => setMenuOpen(true)}
            >
              <span aria-hidden="true">☰</span>
            </button>
          )}
        />
      </div>
      <MobileMenu {...installMenuProps} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
