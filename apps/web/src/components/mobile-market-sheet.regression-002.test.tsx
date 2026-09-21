import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileMarketSheet } from "./mobile-market-sheet";

describe("MobileMarketSheet detail navigation regression", () => {
  it("offers explicit close and list actions for a full detail sheet", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onModeChange = vi.fn();
    const onSnapChange = vi.fn();

    render(
      <MobileMarketSheet
        snap="full"
        onSnapChange={onSnapChange}
        mode="detail"
        onModeChange={onModeChange}
        onClose={onClose}
        title="통복시장 상세"
      >
        <p>통복시장 상세 정보</p>
      </MobileMarketSheet>,
    );

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onClose).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "목록으로" }));
    expect(onModeChange).toHaveBeenCalledWith("results");
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });
});
