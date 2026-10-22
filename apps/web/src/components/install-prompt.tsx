"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "jangnal-install-prompt-dismissed-at";
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1_000;
const VISIT_COUNT_KEY = "jangnal-visit-count";
const VISIT_COUNTED_SESSION_KEY = "jangnal-visit-counted";
const BANNER_SHOWN_SESSION_KEY = "jangnal-install-banner-shown";
const WELCOMED_STORAGE_KEY = "jangnal-pwa-welcomed";
const WELCOME_DURATION_MS = 4_000;

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithUmami extends Window {
  umami?: { track: (event: string, data?: Record<string, string>) => void };
}

// android: 브라우저가 설치 창을 띄워 준다. 나머지는 사용자가 직접 따라 할 안내를 보여 준다.
// browser-menu: 설치 창을 주지 않는 웨일·파이어폭스·오페라는 브라우저 메뉴의 '홈 화면에 추가'로 안내한다.
export type InstallPlatform = "android" | "ios-safari" | "ios-chrome" | "inapp" | "browser-menu";

const IN_APP_BROWSER = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|BAND\//i;
const MENU_INSTALL_BROWSER = /Whale\/|Firefox\/|FxiOS|OPR\/|OPT\//i;

export const detectGuidePlatform = (userAgent: string, maxTouchPoints: number): InstallPlatform | null => {
  if (IN_APP_BROWSER.test(userAgent)) return "inapp";
  if (MENU_INSTALL_BROWSER.test(userAgent)) return "browser-menu";
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  if (!ios) return null;
  return /CriOS/i.test(userAgent) ? "ios-chrome" : "ios-safari";
};

export const trackEvent = (event: string, data?: Record<string, string>) => {
  (window as WindowWithUmami).umami?.track(event, data);
};

const detectOs = (userAgent: string, maxTouchPoints: number): string => {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return "ios";
  return /Android/i.test(userAgent) ? "android" : "other";
};

const readStorage = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storage: Storage, key: string, value: string) => {
  try {
    storage.setItem(key, value);
  } catch {
    // 사파리 개인 정보 보호 모드 등에서는 저장하지 못해도 안내는 계속 보여 준다.
  }
};

const isDismissed = (): boolean => {
  const dismissedAt = Number(readStorage(window.localStorage, DISMISS_STORAGE_KEY));
  return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION_MS;
};

const countVisit = (): number => {
  const count = Number(readStorage(window.localStorage, VISIT_COUNT_KEY)) || 0;
  if (readStorage(window.sessionStorage, VISIT_COUNTED_SESSION_KEY)) return count;
  writeStorage(window.sessionStorage, VISIT_COUNTED_SESSION_KEY, "1");
  writeStorage(window.localStorage, VISIT_COUNT_KEY, String(count + 1));
  return count + 1;
};

const isStandalone = (): boolean => window.matchMedia("(display-mode: standalone)").matches
  || (window.navigator as NavigatorWithStandalone).standalone === true;

export interface InstallPromptState {
  platform: InstallPlatform | null;
  /** 두 번째 방문부터 세션당 한 번만 지도 위 배너를 띄운다. */
  bannerVisible: boolean;
  guideOpen: boolean;
  welcomeVisible: boolean;
  /** 안드로이드는 설치 창을, 그 밖에는 따라 할 안내 시트를 연다. */
  start: () => Promise<void>;
  closeGuide: () => void;
  dismiss: (source: "banner") => void;
}

export function useInstallPrompt(): InstallPromptState {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [bannerAllowed, setBannerAllowed] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 700px)").matches) return;

    if (isStandalone()) {
      if (readStorage(window.sessionStorage, VISIT_COUNTED_SESSION_KEY)) return;
      writeStorage(window.sessionStorage, VISIT_COUNTED_SESSION_KEY, "1");
      trackEvent("pwa-launch");
      if (readStorage(window.localStorage, WELCOMED_STORAGE_KEY)) return;
      writeStorage(window.localStorage, WELCOMED_STORAGE_KEY, "1");
      // 홈 화면 앱은 브라우저와 저장소를 따로 써서, 앱으로 처음 열린 순간이 곧 새 설치다. iOS 설치 수는 이것으로만 셀 수 있다.
      trackEvent("pwa-first-launch", { os: detectOs(window.navigator.userAgent, window.navigator.maxTouchPoints) });
      setWelcomeVisible(true);
      const timer = window.setTimeout(() => setWelcomeVisible(false), WELCOME_DURATION_MS);
      return () => window.clearTimeout(timer);
    }

    const visits = countVisit();
    if (isDismissed()) return;

    setBannerAllowed(visits >= 2 && !readStorage(window.sessionStorage, BANNER_SHOWN_SESSION_KEY));
    setPlatform(detectGuidePlatform(window.navigator.userAgent, window.navigator.maxTouchPoints));

    const handleInstallAvailable = (rawEvent: Event) => {
      const event = rawEvent as InstallEvent;
      event.preventDefault();
      setInstallEvent(event);
      setPlatform("android");
    };
    const handleInstalled = () => {
      trackEvent("app-installed");
      setInstallEvent(null);
      setPlatform(null);
    };

    window.addEventListener("beforeinstallprompt", handleInstallAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const bannerVisible = bannerAllowed && platform !== null;

  useEffect(() => {
    if (!bannerVisible) return;
    writeStorage(window.sessionStorage, BANNER_SHOWN_SESSION_KEY, "1");
    trackEvent("install-banner-view", { platform: platform ?? "" });
  }, [bannerVisible, platform]);

  const closeGuide = useCallback(() => setGuideOpen(false), []);

  const dismiss = (source: "banner") => {
    trackEvent("install-dismiss", { platform: platform ?? "", source });
    writeStorage(window.localStorage, DISMISS_STORAGE_KEY, String(Date.now()));
    setPlatform(null);
    setInstallEvent(null);
    setGuideOpen(false);
  };

  const start = async () => {
    if (!platform) return;
    trackEvent("install-click", { platform });
    if (platform !== "android") {
      setGuideOpen(true);
      return;
    }
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    trackEvent(choice.outcome === "accepted" ? "install-accepted" : "install-dismissed");
    setInstallEvent(null);
    setPlatform(null);
  };

  return {
    platform,
    bannerVisible,
    guideOpen,
    welcomeVisible,
    start,
    closeGuide,
    dismiss,
  };
}
