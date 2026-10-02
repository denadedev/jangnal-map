import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ReviewedMarketGuides, type ReviewedMarketGuide } from "./reviewed-market-guides";

const guides: ReviewedMarketGuide[] = [
  { id: "one", name: "첫 시장", schedule: "4·9일장", href: "/markets/첫-시장-one", summary: "상설 구역과 오일장 구역을 함께 둘러보는 시장입니다." },
  { id: "two", name: "두 번째 시장", schedule: "매일", href: "/markets/두-번째-시장-two" },
];

describe("ReviewedMarketGuides", () => {
  it("renders reviewed market links with their schedule", () => {
    render(<ReviewedMarketGuides guides={guides} />);

    expect(screen.getByRole("heading", { name: "시장별 방문 정보" })).toBeInTheDocument();
    expect(screen.getByText("주소·주차·교통·방문 팁을 정리했어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /첫 시장.*4·9일장/ })).toHaveAttribute("href", guides[0].href);
    expect(screen.getByText(guides[0].summary!)).toBeVisible();
    expect(screen.getAllByRole("link", { hidden: true })).toHaveLength(2);
  });

  it("uses a native disclosure for the remaining guides", async () => {
    const user = userEvent.setup();
    render(<ReviewedMarketGuides guides={guides} />);

    const toggle = screen.getByText("시장 2곳 전체 안내");
    const disclosure = toggle.closest("details");
    expect(disclosure).not.toHaveAttribute("open");

    await user.click(toggle);
    expect(disclosure).toHaveAttribute("open");

    await user.click(toggle);
    expect(disclosure).not.toHaveAttribute("open");
  });
});
