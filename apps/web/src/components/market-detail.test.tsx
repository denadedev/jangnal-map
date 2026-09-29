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

  it("opens a mobile visit-date calendar and applies the selected day", async () => {
    const user = userEvent.setup();
    const onVisitDateChange = vi.fn();
    render(<MarketDetail mobile market={marketFixture} today={new Date(2026, 8, 29)} selectedDate={new Date(2026, 8, 30)} onVisitDateChange={onVisitDateChange} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "방문 날짜 바꾸기" }));
    const picker = screen.getByRole("dialog", { name: "방문 날짜 선택" });
    await user.click(within(picker).getByRole("button", { name: "다음 달" }));
    await user.click(within(picker).getByRole("button", { name: "2026년 10월 5일" }));
    await user.click(within(picker).getByRole("button", { name: "이 날짜 적용" }));

    expect(onVisitDateChange).toHaveBeenCalledWith("2026-10-05");
  });

  it("keeps keyboard focus inside the mobile date picker and returns it on close", async () => {
    const user = userEvent.setup();
    render(<MarketDetail mobile market={marketFixture} today={new Date(2026, 8, 29)} selectedDate={new Date(2026, 8, 30)} onVisitDateChange={vi.fn()} onClose={vi.fn()} />);
    const opener = screen.getByRole("button", { name: "방문 날짜 바꾸기" });
    await user.click(opener);
    const picker = screen.getByRole("dialog", { name: "방문 날짜 선택" });
    const close = within(picker).getByRole("button", { name: "닫기" });
    expect(close).toHaveFocus();

    await user.tab({ shift: true });
    expect(within(picker).getByRole("button", { name: "이 날짜 적용" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(picker).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("explains a Korean visit date without implying a mixed market is entirely closed", () => {
    render(<MarketDetail market={marketFixture} today={new Date(2026, 8, 3)} selectedDate={new Date(2026, 8, 6)} onClose={vi.fn()} />);

    const visitDate = screen.getByRole("region", { name: "선택한 방문 날짜" });
    expect(within(visitDate).getByText("9월 6일 일요일")).toBeInTheDocument();
    expect(within(visitDate).getByText("이날은 5일장이 아니에요")).toBeInTheDocument();
    expect(within(visitDate).getByText(/상설 점포/)).toBeInTheDocument();
    expect(screen.getByText("오늘 기준 다음 장날")).toBeInTheDocument();
  });

  it("shows the selected month's market days and source date before directions", () => {
    render(<MarketDetail market={marketFixture} today={new Date(2026, 8, 3)} selectedDate={new Date(2026, 9, 5)} onClose={vi.fn()} />);

    const detail = screen.getByRole("article", { name: /통복시장 상세정보/ });
    expect(within(detail).getByRole("heading", { name: "2026년 10월 장날" })).toBeInTheDocument();
    const calendar = within(detail).getByRole("list", { name: "이달의 장날" });
    expect(calendar.querySelector('time[datetime="2026-10-05"]')?.parentElement).toHaveClass("is-market-day");
    expect(calendar.querySelector('time[datetime="2026-10-10"]')?.parentElement).toHaveClass("is-market-day");
    expect(calendar.querySelector('time[datetime="2026-10-06"]')?.parentElement).not.toHaveClass("is-market-day");
    expect(within(calendar).getByLabelText("2026년 10월 5일, 장날, 선택한 방문 날짜")).toBeInTheDocument();
    expect(within(calendar).getByLabelText("2026년 10월 6일")).toBeInTheDocument();
    expect(detail.textContent?.indexOf("데이터 기준일 2025.11.10")).toBeLessThan(detail.textContent?.indexOf("방문 정보") ?? 0);
    expect(within(detail).getByText(/현장 최종 확인일이 아닙니다/)).toBeInTheDocument();
  });

  it("uses a neutral visit-date state for an unconfirmed schedule", () => {
    render(<MarketDetail market={{ ...marketFixture, schedule: { kind: "unknown", raw: "확인 중" } }} today={new Date(2026, 8, 3)} selectedDate={new Date(2026, 8, 6)} onClose={vi.fn()} />);

    const visitDate = screen.getByRole("region", { name: "선택한 방문 날짜" });
    expect(within(visitDate).getByText("운영 일정 확인 필요")).toBeInTheDocument();
    expect(visitDate).not.toHaveClass("is-not-market-day");
  });

  it("uses English date labels and market-day status in the English calendar", () => {
    render(<MarketDetail locale="en" market={marketFixture} today={new Date(2026, 8, 3)} selectedDate={new Date(2026, 9, 5)} onClose={vi.fn()} />);

    const calendar = screen.getByRole("list", { name: "Market days this month" });
    const selectedDay = within(calendar).getByLabelText("October 5, 2026, market day, selected visit date");
    expect(selectedDay).toHaveTextContent("5");
    expect(selectedDay.textContent).not.toMatch(/[월일]/);
  });
});
