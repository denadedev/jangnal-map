import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileMarketSheet } from "./mobile-market-sheet";

describe("MobileMarketSheet", () => {
  it("moves between snap states with buttons and keyboard", async () => {
    const user = userEvent.setup();
    let view: ReturnType<typeof render>;
    const renderSheet = (snap: "collapsed" | "half" | "full") => (
      <MobileMarketSheet
        snap={snap}
        onSnapChange={onSnapChange}
        mode="results"
        onModeChange={vi.fn()}
        title="시장 결과"
      >
        <p>시장 목록</p>
      </MobileMarketSheet>
    );
    const onSnapChange = vi.fn((snap: "collapsed" | "half" | "full") => view.rerender(renderSheet(snap)));
    view = render(renderSheet("collapsed"));

    await user.click(screen.getByRole("button", { name: "목록 열기" }));
    expect(onSnapChange).toHaveBeenCalledWith("half");
    await user.click(screen.getByRole("button", { name: "목록 크게 보기" }));
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });

  it("returns from detail mode to results with the list action", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const onSnapChange = vi.fn();
    render(
      <MobileMarketSheet
        snap="full"
        onSnapChange={onSnapChange}
        mode="detail"
        onModeChange={onModeChange}
        title="통복시장 상세"
      >
        <p>통복시장</p>
      </MobileMarketSheet>,
    );

    await user.click(screen.getByRole("button", { name: "목록으로" }));
    expect(onModeChange).toHaveBeenCalledWith("results");
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });
});
