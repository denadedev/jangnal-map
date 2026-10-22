import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MarketFilters } from "./market-filters";

describe("MarketFilters", () => {
  it("offers an all-markets filter", async () => {
    const onModeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MarketFilters
        mode="today"
        query=""
        onModeChange={onModeChange}
        onQueryChange={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "전체" }));
    expect(onModeChange).toHaveBeenCalledWith("all");
  });

  it("exposes the active date filter and reports a new filter selection", async () => {
    const onModeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MarketFilters
        mode="today"
        query=""
        onModeChange={onModeChange}
        onQueryChange={() => undefined}
      />,
    );

    expect(screen.getAllByRole("button").filter((button) => button.classList.contains("filter-pill")).map((button) => button.textContent)).toEqual(["오늘", "다가오는 주말", "전체"]);
    expect(screen.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "다가오는 주말" }));

    expect(onModeChange).toHaveBeenCalledWith("weekend");
  });

  it("offers a labelled market or region search", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();

    function FilterHarness() {
      const [query, setQuery] = useState("");
      return (
        <MarketFilters
          mode="today"
          query={query}
            onModeChange={() => undefined}
          onQueryChange={(value) => {
            setQuery(value);
            onQueryChange(value);
          }}
          />
      );
    }

    render(<FilterHarness />);

    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "평택");

    expect(onQueryChange).toHaveBeenLastCalledWith("평택");
  });
});
