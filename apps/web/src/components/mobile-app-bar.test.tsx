import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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
    expect(screen.getByRole("link", { name: "온누리상품권" })).toHaveAttribute("href", "/onnuri");
    expect(screen.getByRole("link", { name: "불편 신고" })).toHaveAttribute("href", "/report?kind=service");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "보조 메뉴" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "이전 화면" })).toHaveAttribute("href", "/?when=all");
  });
});
