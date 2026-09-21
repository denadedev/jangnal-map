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

    await user.click(screen.getByRole("button", { name: "결과 펼치기" }));
    expect(onSnapChange).toHaveBeenCalledWith("half");
    await user.click(screen.getByRole("button", { name: "전체 결과 보기" }));
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });

  it("returns from detail mode to results with the map action", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <MobileMarketSheet
        snap="half"
        onSnapChange={vi.fn()}
        mode="detail"
        onModeChange={onModeChange}
        title="통복시장 상세"
      >
        <p>통복시장</p>
      </MobileMarketSheet>,
    );

    await user.click(screen.getByRole("button", { name: "지도 보기" }));
    expect(onModeChange).toHaveBeenCalledWith("results");
  });
});
