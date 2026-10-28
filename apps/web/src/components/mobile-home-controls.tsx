"use client";

import { useState } from "react";

import { MarketFilters, type MarketFiltersProps } from "./market-filters";
import { MobileMenu } from "./mobile-menu";
import { useInstallPrompt } from "./install-prompt";
import { InstallBanner, InstallGuideSheet, InstallWelcomeToast } from "./install-ui";
import { getUiCopy } from "../lib/ui-copy";
import { Icon } from "./icon";

type MobileHomeControlsProps = Omit<MarketFiltersProps, "mobileMenuControl"> & {
  languageSwitchHref?: string;
};

export function MobileHomeControls({ languageSwitchHref, ...props }: MobileHomeControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ui = getUiCopy(props.locale ?? "ko");
  const installPrompt = useInstallPrompt();
  // 한국어 지도는 하단 탭의 더보기가 메뉴를 대신한다. 영어 지도만 ☰를 둔다.
  const hasMenu = props.locale === "en";

  return (
    <>
      <div className="mobile-home-controls">
        <MarketFilters
          {...props}
          mobileMenuControl={hasMenu ? <button
            type="button"
            className="mobile-app-bar-menu"
            aria-label={ui.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu-dialog"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button> : null}
        />
      </div>
      {hasMenu ? (
        <MobileMenu
          locale={props.locale}
          languageSwitchHref={languageSwitchHref}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
      <InstallBanner locale={props.locale} install={installPrompt} />
      <InstallGuideSheet locale={props.locale} install={installPrompt} />
      <InstallWelcomeToast locale={props.locale} visible={installPrompt.welcomeVisible} />
    </>
  );
}
