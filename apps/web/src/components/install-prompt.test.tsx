import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InstallPrompt } from "./install-prompt";

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

describe("InstallPrompt", () => {
  beforeEach(() => window.localStorage.clear());

  afterEach(() => vi.unstubAllGlobals());

  it("opens the native Android install prompt when the browser makes it available", async () => {
    const user = userEvent.setup();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
    setMobileBrowser("Mozilla/5.0 (Linux; Android 15) Chrome/140 Mobile");
    render(<InstallPrompt />);

    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice });
    act(() => window.dispatchEvent(event));
    await user.click(screen.getByRole("button", { name: "추가하기" }));

    expect(prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole("complementary", { name: "홈 화면 추가 안내" })).not.toBeInTheDocument();
  });

  it("shows iPhone instructions and remembers dismissal", async () => {
    const user = userEvent.setup();
    setMobileBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Mobile Safari");
    const view = render(<InstallPrompt />);

    await user.click(screen.getByRole("button", { name: "추가 방법" }));
    expect(screen.getByText("Safari의 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "14일 동안 닫기" }));
    view.unmount();
    render(<InstallPrompt />);

    expect(screen.queryByRole("complementary", { name: "홈 화면 추가 안내" })).not.toBeInTheDocument();
  });

  it("stays hidden when already running from the home screen", () => {
    setMobileBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Mobile Safari", true);
    render(<InstallPrompt />);

    expect(screen.queryByRole("complementary", { name: "홈 화면 추가 안내" })).not.toBeInTheDocument();
  });
});
