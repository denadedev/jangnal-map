import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ReviewedMarketGuides, type ReviewedMarketGuide } from "./reviewed-market-guides";

const guides: ReviewedMarketGuide[] = [
  { id: "one", name: "첫 시장", schedule: "4·9일장", href: "/markets/첫-시장-one" },
  { id: "two", name: "두 번째 시장", schedule: "매일", href: "/markets/두-번째-시장-two" },
];

describe("ReviewedMarketGuides", () => {
  it("renders reviewed market links with their schedule", () => {
    render(<ReviewedMarketGuides guides={guides} />);

    expect(screen.getByRole("heading", { name: "시장별 방문 정보" })).toBeInTheDocument();
    expect(screen.getByText("주소·주차·교통·방문 팁을 정리했어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /첫 시장.*4·9일장/ })).toHaveAttribute("href", guides[0].href);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("starts with the mobile guide disclosure closed and opens it on request", async () => {
    const user = userEvent.setup();
    render(<ReviewedMarketGuides guides={guides} />);

    const toggle = screen.getByRole("button", { name: /시장별 방문 정보/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
