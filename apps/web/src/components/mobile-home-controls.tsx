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
  const installMenuProps = {
    installPlatform: installPrompt.platform,
    installAction: () => {
      setMenuOpen(false);
      return installPrompt.start();
    },
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
            <Icon name="menu" />
          </button>}
        />
      </div>
      <MobileMenu {...installMenuProps} locale={props.locale} languageSwitchHref={languageSwitchHref} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <InstallBanner locale={props.locale} install={installPrompt} />
      <InstallGuideSheet locale={props.locale} install={installPrompt} />
      <InstallWelcomeToast locale={props.locale} visible={installPrompt.welcomeVisible} />
    </>
  );
}
