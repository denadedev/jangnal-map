import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MobileHomeControls } from "./mobile-home-controls";

describe("MobileHomeControls", () => {
  it("keeps search and date controls and leaves the menu to the bottom tabs in Korean", async () => {
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
    expect(screen.queryByRole("button", { name: "메뉴 열기" })).not.toBeInTheDocument();
  });

  it("keeps the menu on the English map", async () => {
    const user = userEvent.setup();
    render(
      <MobileHomeControls
        locale="en"
        mode="today"
        query=""
        onModeChange={() => undefined}
        onQueryChange={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Site menu" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Data sources (Korean)" })).toHaveAttribute("href", "/about#data-policy");
  });
});
