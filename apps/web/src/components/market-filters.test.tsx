import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MarketFilters } from "./market-filters";

describe("MarketFilters", () => {
  it("exposes the active date filter and reports a new filter selection", async () => {
    const onModeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <MarketFilters
        mode="week"
        query=""
        directDate="2026-09-03"
        onModeChange={onModeChange}
        onQueryChange={() => undefined}
        onDirectDateChange={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "이번 주" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "오늘" }));

    expect(onModeChange).toHaveBeenCalledWith("today");
  });

  it("offers a labelled market or region search", async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();

    function FilterHarness() {
      const [query, setQuery] = useState("");
      return (
        <MarketFilters
          mode="week"
          query={query}
          directDate="2026-09-03"
          onModeChange={() => undefined}
          onQueryChange={(value) => {
            setQuery(value);
            onQueryChange(value);
          }}
          onDirectDateChange={() => undefined}
        />
      );
    }

    render(<FilterHarness />);

    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "평택");

    expect(onQueryChange).toHaveBeenLastCalledWith("평택");
  });
});
