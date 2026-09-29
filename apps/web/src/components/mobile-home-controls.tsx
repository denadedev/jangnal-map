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
        <div className="mobile-brand-row">
          <a href={props.locale === "en" ? "/en" : "/"} aria-label={ui.homeLabel}>
            <span className="mobile-app-bar-mark" aria-hidden="true">{props.locale === "en" ? "K" : "장"}</span>
            <strong>{ui.brand}</strong>
          </a>
          <button
            type="button"
            className="mobile-app-bar-menu"
            aria-label={ui.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu-dialog"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">☰</span>
          </button>
        </div>
        <MarketFilters {...props} />
      </div>
      <MobileMenu {...installMenuProps} locale={props.locale} languageSwitchHref={languageSwitchHref} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
