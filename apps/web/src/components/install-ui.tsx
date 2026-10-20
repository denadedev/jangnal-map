"use client";

import { useEffect, useRef, useState } from "react";

import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";
import { BrandMark, Icon, type IconName } from "./icon";
import { trackEvent, type InstallPlatform, type InstallPromptState } from "./install-prompt";

export function AppIcon({ size }: { size: number }) {
  return (
    <span className="install-app-icon" style={{ width: size, height: size }} aria-hidden="true">
      <BrandMark />
    </span>
  );
}

export function InstallBanner({ locale = "ko", install }: { locale?: Locale; install: InstallPromptState }) {
  const ui = getUiCopy(locale);
  if (!install.bannerVisible) return null;

  return (
    <aside className="install-banner" aria-label={ui.installTitle}>
      <AppIcon size={40} />
      <p>{ui.installBanner}</p>
      <button type="button" className="install-banner-add" onClick={() => void install.start()}>{ui.installBannerAdd}</button>
      <button type="button" className="install-banner-close" aria-label={ui.installBannerClose} onClick={install.dismiss}>
        <Icon name="close" />
      </button>
    </aside>
  );
}

type GuideStep = { title: string; hint: string; icon?: IconName; label?: string };

const getGuide = (platform: Exclude<InstallPlatform, "android">, ui: ReturnType<typeof getUiCopy>) => {
  if (platform === "browser-menu") {
    return {
      title: ui.guideTitle,
      sub: ui.guideMenuSub,
      tip: "none" as const,
      steps: [
        { title: ui.guideMenuOpen, hint: ui.guideMenuOpenHint, icon: "menu" },
        { title: ui.guideAddToHome, hint: ui.guideMenuAddHint, icon: "addSquare" },
        { title: ui.guideMenuConfirm, hint: ui.guideConfirmHint, label: ui.guideConfirmIllustration },
      ] satisfies GuideStep[],
    };
  }
  if (platform === "inapp") {
    return {
      title: ui.guideInAppTitle,
      sub: ui.guideInAppSub,
      tip: "top" as const,
      steps: [
        { title: ui.guideInAppMore, hint: ui.guideInAppMoreHint, icon: "dots" },
        { title: ui.guideInAppOpen, hint: ui.guideInAppOpenHint, icon: "compass" },
        { title: ui.guideInAppAgain, hint: ui.guideInAppAgainHint, icon: "addSquare" },
      ] satisfies GuideStep[],
    };
  }
  const safari = platform === "ios-safari";
  return {
    title: ui.guideTitle,
    sub: safari ? ui.guideSafariSub : ui.guideChromeSub,
    tip: safari ? "bottom" as const : "top" as const,
    note: safari ? ui.guideSafariNote : undefined,
    steps: [
      { title: ui.guideShare, hint: safari ? ui.guideShareSafariHint : ui.guideShareChromeHint, icon: "share" },
      { title: ui.guideAddToHome, hint: ui.guideAddToHomeHint, icon: "addSquare" },
      { title: ui.guideConfirm, hint: ui.guideConfirmHint, label: ui.guideConfirmIllustration },
    ] satisfies GuideStep[],
  };
};

export function InstallGuideSheet({ locale = "ko", install }: { locale?: Locale; install: InstallPromptState }) {
  const ui = getUiCopy(locale);
  const sheetRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const { guideOpen, closeGuide, platform } = install;

  useEffect(() => {
    if (!guideOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheetRef.current?.querySelector<HTMLElement>("button")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGuide();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [closeGuide, guideOpen]);

  if (!guideOpen || !platform || platform === "android") return null;
  const guide = getGuide(platform, ui);

  const copyLink = async () => {
    trackEvent("install-guide-copy-link");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="install-guide-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) closeGuide();
    }}>
      {guide.tip === "none" ? null : <p className={`install-guide-tip is-${guide.tip}`} aria-hidden="true">{ui.guideTip}</p>}
      <section
        ref={sheetRef}
        className={`install-guide-sheet is-tip-${guide.tip}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
      >
        <span className="install-guide-grip" aria-hidden="true" />
        <h2 id="install-guide-title">{guide.title}</h2>
        <p className="install-guide-sub">{guide.sub}</p>
        <ol className="install-guide-steps">
          {guide.steps.map((step, index) => (
            <li key={step.title}>
              <span className="install-guide-num" aria-hidden="true">{index + 1}</span>
              <div>
                <p className="install-guide-step-title">{step.title}</p>
                <p className="install-guide-step-hint">{step.hint}</p>
              </div>
              <span className="install-guide-ill" aria-hidden="true">
                {step.icon ? <Icon name={step.icon} /> : <b>{step.label}</b>}
              </span>
            </li>
          ))}
        </ol>
        {"note" in guide && guide.note ? <p className="install-guide-note">{guide.note}</p> : null}
        {platform === "inapp" ? (
          <div className="install-guide-actions">
            <button type="button" className="install-guide-copy" onClick={() => void copyLink()}>
              <Icon name="copy" />{copied ? ui.linkCopied : ui.copyLink}
            </button>
            <button type="button" className="install-guide-close is-compact" onClick={closeGuide}>{ui.close}</button>
          </div>
        ) : (
          <button type="button" className="install-guide-close" onClick={closeGuide}>{ui.close}</button>
        )}
      </section>
    </div>
  );
}

export function InstallWelcomeToast({ locale = "ko", visible }: { locale?: Locale; visible: boolean }) {
  const ui = getUiCopy(locale);
  if (!visible) return null;

  return (
    <aside className="install-welcome" role="status">
      <AppIcon size={36} />
      <div>
        <b>{ui.welcomeTitle}</b>
        <span>{ui.welcomeBody}</span>
      </div>
    </aside>
  );
}
