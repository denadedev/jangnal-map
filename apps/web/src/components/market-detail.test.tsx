import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { publicMarkets } from "../lib/market-catalog";
import { MarketDetail } from "./market-detail";

const marketFixture = publicMarkets.find((market) => market.name === "통복시장") ?? publicMarkets[0];

describe("MarketDetail", () => {
  it("links a reviewed market name to its standalone detail page", () => {
    render(
      <MarketDetail
        market={marketFixture}
        detailPath="/markets/통복시장-reviewed"
        today={new Date(2026, 8, 3)}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: marketFixture.name })).toHaveAttribute(
      "href",
      "/markets/통복시장-reviewed",
    );
  });

  it("puts the next date before visit actions on mobile detail", () => {
    render(<MarketDetail market={marketFixture} today={new Date(2026, 8, 3)} onClose={vi.fn()} />);
    const detail = screen.getByRole("article", { name: /통복시장|시장 상세정보/ });
    expect(detail.textContent?.indexOf("다음 장날")).toBeLessThan(detail.textContent?.indexOf("방문 정보") ?? 0);
    expect(screen.getByRole("button", { name: "시장 상세 닫기" })).toHaveAttribute("aria-label");
  });

  it("closes the detail when the close action is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MarketDetail market={marketFixture} today={new Date(2026, 8, 3)} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "시장 상세 닫기" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses English visit labels and one map-service trigger", () => {
    render(<MarketDetail locale="en" market={marketFixture} today={new Date(2026, 8, 3)} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Visitor information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maps & directions" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "NAVER 지도에서 길찾기" })).not.toBeInTheDocument();
  });

  it("confirms the travel date separately from the next market day", () => {
    render(<MarketDetail locale="en" market={marketFixture} today={new Date(2026, 8, 3)} selectedDate={new Date(2026, 8, 5)} onClose={vi.fn()} />);

    const selectedDate = screen.getByRole("region", { name: "Your selected travel date" });
    expect(within(selectedDate).getByText("Market day on your selected date")).toBeInTheDocument();
    expect(within(selectedDate).getByText(/Sep 5, 2026/)).toBeInTheDocument();
  });
});
