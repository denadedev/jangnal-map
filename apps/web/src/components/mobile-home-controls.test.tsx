import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MobileHomeControls } from "./mobile-home-controls";

describe("MobileHomeControls", () => {
  it("keeps search and date controls available and opens the auxiliary links", async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const onModeChange = vi.fn();
    function ControlledControls() {
      const [query, setQuery] = useState("");
      return (
        <MobileHomeControls
          mode="weekend"
          query={query}
          onModeChange={onModeChange}
          onQueryChange={(value) => { onQueryChange(value); setQuery(value); }}
        />
      );
    }
    render(
      <ControlledControls />,
    );

    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "Seoul");
    expect(onQueryChange).toHaveBeenLastCalledWith("Seoul");
    await user.click(screen.getByRole("button", { name: "오늘" }));
    expect(onModeChange).toHaveBeenCalledWith("today");

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("dialog", { name: "보조 메뉴" })).toBeVisible();
    expect(screen.getByRole("link", { name: "데이터 출처와 편집 기준" })).toHaveAttribute("href", "/about#data-policy");
  });

  it("opens the market picker from the menu when submissions are on", async () => {
    const user = userEvent.setup();
    render(
      <MobileHomeControls
        mode="today"
        query=""
        onModeChange={() => undefined}
        onQueryChange={() => undefined}
        participate={{ markets: [], today: new Date(2026, 9, 22), currentLocation: null }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await user.click(screen.getByRole("button", { name: "다녀온 장 이야기 들려주기" }));
    expect(screen.queryByRole("dialog", { name: "보조 메뉴" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "어느 장이었나요?" })).toBeVisible();
  });
});
