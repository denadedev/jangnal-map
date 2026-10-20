"use client";

import { useState } from "react";

import { MarketFilters, type MarketFiltersProps } from "./market-filters";
import { MobileMenu } from "./mobile-menu";
import { useInstallPrompt } from "./install-prompt";
import { getUiCopy } from "../lib/ui-copy";

type MobileHomeControlsProps = Omit<MarketFiltersProps, "mobileMenuControl"> & {
  languageSwitchHref?: string;
};

export function MobileHomeControls({ languageSwitchHref, ...props }: MobileHomeControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ui = getUiCopy(props.locale ?? "ko");
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
      <div className="mobile-home-controls">
        <MarketFilters
          {...props}
          mobileMenuControl={<button
            type="button"
            className="mobile-app-bar-menu"
            aria-label={ui.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu-dialog"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>}
        />
      </div>
      <MobileMenu {...installMenuProps} locale={props.locale} languageSwitchHref={languageSwitchHref} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
