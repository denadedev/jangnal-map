"use client";

import { useState } from "react";

import type { PublicMarket } from "../lib/market";
import type { Coordinates } from "../lib/market-view";
import { MarketFilters, type MarketFiltersProps } from "./market-filters";
import { MobileMenu } from "./mobile-menu";
import { useInstallPrompt } from "./install-prompt";
import { InstallBanner, InstallGuideSheet, InstallWelcomeToast } from "./install-ui";
import { getUiCopy } from "../lib/ui-copy";
import { Icon } from "./icon";
import { MenuSubmissionFlow } from "./today-highlight-prompt";

type MobileHomeControlsProps = Omit<MarketFiltersProps, "mobileMenuControl"> & {
  languageSwitchHref?: string;
  /** 제보를 받을 수 있을 때만 넘긴다. 메뉴에 "다녀온 장 이야기 들려주기"가 생긴다. */
  participate?: { markets: PublicMarket[]; today: Date; currentLocation: Coordinates | null } | null;
};

export function MobileHomeControls({ languageSwitchHref, participate, ...props }: MobileHomeControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [participating, setParticipating] = useState(false);
  const ui = getUiCopy(props.locale ?? "ko");
  const installPrompt = useInstallPrompt();

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
            <Icon name="menu" />
          </button>}
        />
      </div>
      <MobileMenu
        locale={props.locale}
        languageSwitchHref={languageSwitchHref}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onParticipate={participate ? () => {
          setMenuOpen(false);
          setParticipating(true);
        } : undefined}
      />
      {participate && participating ? <MenuSubmissionFlow {...participate} onClose={() => setParticipating(false)} /> : null}
      <InstallBanner locale={props.locale} install={installPrompt} />
      <InstallGuideSheet locale={props.locale} install={installPrompt} />
      <InstallWelcomeToast locale={props.locale} visible={installPrompt.welcomeVisible} />
    </>
  );
}
