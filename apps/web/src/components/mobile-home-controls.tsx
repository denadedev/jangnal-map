"use client";

import { useState, type RefObject } from "react";

import { MarketFilters, type MarketFiltersProps } from "./market-filters";
import { MobileMenu } from "./mobile-menu";
import { useInstallPrompt } from "./install-prompt";
import { getUiCopy } from "../lib/ui-copy";

type MobileHomeControlsProps = Omit<MarketFiltersProps, "mobileMenuControl"> & {
  containerRef?: RefObject<HTMLDivElement | null>;
  languageSwitchHref?: string;
  rangeLabel?: string;
  mobileView?: "map" | "list";
  onViewChange?: (view: "map" | "list") => void;
};

export function MobileHomeControls({ containerRef, languageSwitchHref, rangeLabel, mobileView = "map", onViewChange, ...props }: MobileHomeControlsProps) {
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
      <div ref={containerRef} className="mobile-home-controls">
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
        {rangeLabel && onViewChange ? (
          <div className="mobile-discovery-context">
            <p>{props.query ? ui.searchResultsHeading : ui.marketDiscoveryHeading} · {rangeLabel}</p>
            <h1>{props.query ? localeSearchHeading(props.query, props.locale ?? "ko") : ui.marketDiscoveryTitle}</h1>
            <small>{ui.marketDiscoveryHelp}</small>
            <div className="mobile-view-switch" role="group" aria-label={ui.resultViewLabel}>
              <button type="button" aria-pressed={mobileView === "map"} onClick={() => onViewChange("map")}>{ui.mapView}</button>
              <button type="button" aria-pressed={mobileView === "list"} onClick={() => onViewChange("list")}>{ui.listView}</button>
            </div>
          </div>
        ) : null}
      </div>
      <MobileMenu {...installMenuProps} locale={props.locale} languageSwitchHref={languageSwitchHref} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function localeSearchHeading(query: string, locale: "ko" | "en") {
  return locale === "en" ? `Markets for “${query}”` : `“${query}” 시장 찾기`;
}
