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

export interface InstallPromptState {
  platform: "android" | "ios" | null;
  install: () => Promise<void>;
  showIosGuide: () => void;
  iosGuide: boolean;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptState {
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
    setInstallEvent(null);
    setShowIosGuide(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setPlatform(null);
  };

  return { platform, install, showIosGuide: () => setShowIosGuide(true), iosGuide: showIosGuide, dismiss };
}
