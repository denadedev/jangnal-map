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
          mode="week"
          query={query}
          directDate="2026-09-24"
          minDate="2026-09-24"
          onModeChange={onModeChange}
          onQueryChange={(value) => { onQueryChange(value); setQuery(value); }}
          onDirectDateChange={() => undefined}
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
});
