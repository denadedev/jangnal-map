import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileMarketSheet } from "./mobile-market-sheet";

describe("MobileMarketSheet detail navigation regression", () => {
  it("offers one back action for full-screen detail", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MobileMarketSheet
        snap="full"
        onSnapChange={vi.fn()}
        mode="detail"
        onModeChange={vi.fn()}
        onClose={onClose}
        title="통복시장 상세"
      >
        <p>통복시장 상세 정보</p>
      </MobileMarketSheet>,
    );

    await user.click(screen.getByRole("button", { name: "탐색으로 돌아가기" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "목록으로" })).not.toBeInTheDocument();
  });
});
