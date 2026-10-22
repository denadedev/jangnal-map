import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { detectGuidePlatform, useInstallPrompt } from "./install-prompt";
import { InstallBanner, InstallGuideSheet, InstallWelcomeToast } from "./install-ui";

const IOS_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IOS_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0 Mobile/15E148 Safari/604.1";
const IOS_KAKAOTALK = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 25.8.0";
const ANDROID_KAKAOTALK = "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36 KAKAOTALK/25.8.0 (INAPP)";
const ANDROID_WHALE = "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Whale/4.33.332.18 Mobile Safari/537.36";
const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36";

const setMobileBrowser = (userAgent: string, standalone = false) => {
  Object.defineProperty(window.navigator, "userAgent", { configurable: true, value: userAgent });
  Object.defineProperty(window.navigator, "standalone", { configurable: true, value: standalone });
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    matches: query === "(max-width: 700px)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
};

function InstallHarness() {
  const install = useInstallPrompt();
  return (
    <>
      <InstallBanner install={install} />
      <InstallGuideSheet install={install} />
      <InstallWelcomeToast visible={install.welcomeVisible} />
    </>
  );
}

const startNewSession = () => window.sessionStorage.clear();
// 배너는 두 번째 방문부터 뜬다. 첫 방문을 이미 한 것으로 둔다.
const seedFirstVisit = () => window.localStorage.setItem("jangnal-visit-count", "1");

describe("detectGuidePlatform", () => {
  it("tells Safari, Chrome and in-app browsers apart", () => {
    expect(detectGuidePlatform(IOS_SAFARI, 5)).toBe("ios-safari");
    expect(detectGuidePlatform(IOS_CHROME, 5)).toBe("ios-chrome");
    expect(detectGuidePlatform(IOS_KAKAOTALK, 5)).toBe("inapp");
    expect(detectGuidePlatform(ANDROID_KAKAOTALK, 5)).toBe("inapp");
    expect(detectGuidePlatform("Mozilla/5.0 (Linux; Android 15) NAVER(inapp; search; 2000; 12.0.0)", 5)).toBe("inapp");
    expect(detectGuidePlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", 5)).toBe("ios-safari");
    expect(detectGuidePlatform(ANDROID_WHALE, 5)).toBe("browser-menu");
    expect(detectGuidePlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Whale/3.2.0 Mobile/15E148 Safari/605.1", 5)).toBe("browser-menu");
    expect(detectGuidePlatform("Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0", 5)).toBe("browser-menu");
    expect(detectGuidePlatform(ANDROID_CHROME, 5)).toBeNull();
  });
});

describe("useInstallPrompt", () => {
  const track = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    track.mockClear();
    (window as unknown as { umami: { track: typeof track } }).umami = { track };
  });

  afterEach(() => vi.unstubAllGlobals());

  it("opens the native Android install prompt when the browser makes it available", async () => {
    const user = userEvent.setup();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
    setMobileBrowser(ANDROID_CHROME);
    seedFirstVisit();
    render(<InstallHarness />);

    expect(screen.queryByRole("complementary", { name: "홈 화면에 추가" })).not.toBeInTheDocument();
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice });
    act(() => window.dispatchEvent(event));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(prompt).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith("install-click", { platform: "android" });
    expect(track).toHaveBeenCalledWith("install-accepted", undefined);
    expect(screen.queryByRole("button", { name: "추가" })).not.toBeInTheDocument();
  });

  it("shows the Safari steps and remembers dismissal for 14 days", async () => {
    const user = userEvent.setup();
    setMobileBrowser(IOS_SAFARI);
    seedFirstVisit();
    const view = render(<InstallHarness />);

    await user.click(screen.getByRole("button", { name: "추가" }));
    const guide = screen.getByRole("dialog", { name: "홈 화면에 추가하는 방법" });
    expect(guide).toHaveTextContent("아이폰 Safari에서 3번만 누르면 돼요");
    expect(guide).toHaveTextContent("맨 아래 가운데, 네모에 화살표 모양");
    expect(guide).toHaveTextContent("iOS 26");
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog", { name: "홈 화면에 추가하는 방법" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "홈 화면 추가 안내 14일 동안 닫기" }));
    expect(track).toHaveBeenCalledWith("install-dismiss", { platform: "ios-safari", source: "banner" });
    view.unmount();
    startNewSession();
    render(<InstallHarness />);

    expect(screen.queryByRole("complementary", { name: "홈 화면에 추가" })).not.toBeInTheDocument();
  });

  it("points iPhone Chrome users to the share button at the top", async () => {
    const user = userEvent.setup();
    setMobileBrowser(IOS_CHROME);
    seedFirstVisit();
    render(<InstallHarness />);

    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("dialog", { name: "홈 화면에 추가하는 방법" })).toHaveTextContent("오른쪽 위, 주소창 맨 끝 모양");
  });

  it("guides Whale users through the browser menu until the browser offers its own install prompt", async () => {
    const user = userEvent.setup();
    setMobileBrowser(ANDROID_WHALE);
    seedFirstVisit();
    render(<InstallHarness />);

    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByRole("dialog", { name: "홈 화면에 추가하는 방법" })).toHaveTextContent("브라우저 메뉴 열기");
    await user.click(screen.getByRole("button", { name: "닫기" }));

    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    });
    act(() => window.dispatchEvent(event));
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(prompt).toHaveBeenCalledOnce();
  });

  it("asks in-app browser users to open another browser first and copies the link", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    setMobileBrowser(IOS_KAKAOTALK);
    seedFirstVisit();
    render(<InstallHarness />);

    await user.click(screen.getByRole("button", { name: "추가" }));
    const guide = screen.getByRole("dialog", { name: "이 화면에서는 바로 추가할 수 없어요" });
    expect(guide).toHaveTextContent("다른 브라우저로 열기");
    expect(guide).not.toHaveTextContent("Safari에서 3번만");

    await user.click(screen.getByRole("button", { name: "링크 복사" }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole("button", { name: "복사했어요" })).toBeInTheDocument();
  });

  it("shows the banner from the second visit, once per session", async () => {
    setMobileBrowser(IOS_SAFARI);
    const first = render(<InstallHarness />);
    expect(screen.queryByRole("complementary", { name: "홈 화면에 추가" })).not.toBeInTheDocument();
    first.unmount();

    startNewSession();
    const second = render(<InstallHarness />);
    expect(screen.getByRole("complementary", { name: "홈 화면에 추가" })).toHaveTextContent("홈 화면에 추가하고 바로 열기");
    expect(track).toHaveBeenCalledWith("install-banner-view", { platform: "ios-safari" });
    await userEvent.setup().click(screen.getByRole("button", { name: "홈 화면 추가 안내 14일 동안 닫기" }));
    expect(track).toHaveBeenCalledWith("install-dismiss", { platform: "ios-safari", source: "banner" });
    second.unmount();

    render(<InstallHarness />);
    expect(screen.queryByRole("complementary", { name: "홈 화면에 추가" })).not.toBeInTheDocument();
  });

  it("hides install prompts in the home-screen app and welcomes the first launch once", () => {
    vi.useFakeTimers();
    setMobileBrowser(IOS_SAFARI, true);
    seedFirstVisit();
    const first = render(<InstallHarness />);

    expect(screen.queryByRole("complementary", { name: "홈 화면에 추가" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("홈 화면에서 바로 열었어요");
    expect(track).toHaveBeenCalledWith("pwa-launch", undefined);
    expect(track).toHaveBeenCalledWith("pwa-first-launch", { os: "ios" });
    act(() => vi.advanceTimersByTime(4_000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    first.unmount();

    startNewSession();
    track.mockClear();
    render(<InstallHarness />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith("pwa-launch", undefined);
    expect(track).not.toHaveBeenCalledWith("pwa-first-launch", expect.anything());
    vi.useRealTimers();
  });
});
