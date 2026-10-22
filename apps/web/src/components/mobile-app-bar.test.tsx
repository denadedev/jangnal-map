import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileAppBar } from "./mobile-app-bar";

describe("MobileAppBar", () => {
  it("opens the mobile menu and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<MobileAppBar title="오늘 장날" />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("dialog", { name: "보조 메뉴" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
  });

  it("closes the menu with Escape and exposes auxiliary links", async () => {
    const user = userEvent.setup();
    render(<MobileAppBar title="시장 정보" backHref="/?when=all" />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("link", { name: "지역별 장날" })).toHaveAttribute("href", "/jangnal");
    expect(screen.getByRole("link", { name: "온누리상품권 가맹시장" })).toHaveAttribute("href", "/onnuri");
    expect(screen.getByRole("link", { name: "정보 수정·불편 신고" })).toHaveAttribute("href", "/report?kind=service");
    expect(screen.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/terms",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "보조 메뉴" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "이전 화면" })).toHaveAttribute("href", "/?when=all");
  });

  it("shows today's market-day digits and shares the service, copying the link when the share sheet is missing", async () => {
    const user = userEvent.setup();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-22T03:00:00Z"));
    vi.stubGlobal("navigator", { ...window.navigator, share: undefined, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<MobileAppBar title="오늘 장날" />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    const dialog = screen.getByRole("dialog", { name: "보조 메뉴" });
    expect(dialog).toHaveTextContent("10월 22일 목요일");
    expect(dialog).toHaveTextContent("오늘은 2·7 장");
    expect(screen.queryByRole("button", { name: "다녀온 장 이야기 들려주기" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/map");

    await user.click(screen.getByRole("button", { name: "가족에게 오늘 장날 알려주기" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/`);
    expect(await screen.findByRole("status")).toHaveTextContent("링크를 복사했어요");

    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
