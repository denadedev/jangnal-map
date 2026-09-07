"use client";

import { useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "jangnal-install-prompt-dismissed-at";
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1_000;

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

const isDismissed = (): boolean => {
  const dismissedAt = Number(window.localStorage.getItem(DISMISS_STORAGE_KEY));
  return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_DURATION_MS;
};

const isIos = (): boolean => {
  const userAgent = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && window.navigator.maxTouchPoints > 1);
};

const isStandalone = (): boolean => window.matchMedia("(display-mode: standalone)").matches
  || (window.navigator as NavigatorWithStandalone).standalone === true;

export function InstallPrompt() {
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(max-width: 700px)").matches || isStandalone() || isDismissed()) return;

    if (isIos()) setPlatform("ios");

    const handleInstallAvailable = (rawEvent: Event) => {
      const event = rawEvent as InstallEvent;
      event.preventDefault();
      setInstallEvent(event);
      setPlatform("android");
    };
    const handleInstalled = () => {
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

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setPlatform(null);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setPlatform(null);
  };

  if (!platform) return null;

  return (
    <aside className="install-prompt" role="complementary" aria-label="홈 화면 추가 안내">
      <span className="install-prompt-mark" aria-hidden="true">+</span>
      <div className="install-prompt-copy">
        <strong>홈 화면에 추가하세요</strong>
        <p>장날을 앱처럼 빠르게 확인할 수 있어요.</p>
        {showIosGuide ? <p className="install-prompt-guide">Safari의 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.</p> : null}
      </div>
      {platform === "android" ? (
        <button className="install-prompt-action" type="button" onClick={() => void install()}>추가하기</button>
      ) : (
        <button className="install-prompt-action" type="button" onClick={() => setShowIosGuide(true)}>추가 방법</button>
      )}
      <button className="install-prompt-close" type="button" onClick={dismiss} aria-label="14일 동안 닫기">×</button>
    </aside>
  );
}
