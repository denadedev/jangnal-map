import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MarketLink } from "../lib/jangnal-landing";
import { HubToday, PatternDates, RegionToday } from "./jangnal-today";

const market = (id: string, name: string, days: [number, number], reviewed = false): MarketLink => ({
  id,
  name,
  district: "경주시",
  marketType: "5일장",
  schedule: { kind: "digit-pair", days },
  hasParking: null,
  href: reviewed ? `/markets/${id}` : `/?when=all&market=${id}`,
  reviewed,
});

const fixture = [
  market("a", "안강공설시장", [4, 9], true),
  market("b", "감포시장", [3, 8]),
];

const setKoreaTime = (iso: string) => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(iso));
};

describe("RegionToday", () => {
  afterEach(() => vi.useRealTimers());

  it("renders no dates before hydration", () => {
    const markup = renderToStaticMarkup(<RegionToday markets={fixture} regionName="경북" />);
    expect(markup).not.toMatch(/\d+월 \d+일/);
  });

  it("uses the Korea date even when the browser clock is in UTC", async () => {
    setKoreaTime("2026-10-13T15:30:00Z");
    render(<RegionToday markets={fixture} regionName="경북" />);
    const today = await screen.findByRole("region", { name: "오늘 열리는 장" });
    expect(today).toHaveTextContent("10월 14일 수요일");
    expect(within(today).getByText("안강공설시장")).toBeInTheDocument();
  });

  it("shows the next open date when nothing opens today", async () => {
    setKoreaTime("2026-10-15T03:00:00Z");
    render(<RegionToday markets={fixture} regionName="경북" />);
    const today = await screen.findByRole("region", { name: "오늘 열리는 장" });
    expect(today).toHaveTextContent("다음 장날은 10월 18일 일요일");
  });

  it("lists Saturday and Sunday separately", async () => {
    setKoreaTime("2026-10-14T03:00:00Z");
    render(<RegionToday markets={fixture} regionName="경북" />);
    const weekend = await screen.findByRole("region", { name: "이번 주말 열리는 장" });
    expect(weekend).toHaveTextContent("10월 17일 토요일");
    expect(weekend).toHaveTextContent("10월 18일 일요일");
    expect(within(weekend).getByText("감포시장")).toBeInTheDocument();
  });

  it("shows the selected day's markets when a calendar cell is pressed", async () => {
    setKoreaTime("2026-10-14T03:00:00Z");
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RegionToday markets={fixture} regionName="경북" />);
    await user.click(await screen.findByRole("button", { name: "10월 23일, 3·8일장, 1곳" }));
    const calendar = screen.getByRole("region", { name: /장날 달력/ });
    expect(within(calendar).getByRole("button", { name: "10월 23일, 3·8일장, 1곳" })).toHaveAttribute("aria-pressed", "true");
    expect(calendar).toHaveTextContent("10월 23일 금요일");
    expect(within(calendar).getAllByText("감포시장").length).toBeGreaterThan(0);
  });

  it("marks reviewed and unreviewed links for analytics", async () => {
    setKoreaTime("2026-10-14T03:00:00Z");
    render(<RegionToday markets={fixture} regionName="경북" />);
    const today = await screen.findByRole("region", { name: "오늘 열리는 장" });
    const link = within(today).getByRole("link", { name: /안강공설시장/ });
    expect(link).toHaveAttribute("href", "/markets/a");
    expect(link).toHaveAttribute("data-umami-event", "region-market-click");
    expect(link).toHaveAttribute("data-umami-event-reviewed", "true");
  });
});

describe("PatternDates", () => {
  afterEach(() => vi.useRealTimers());

  it("lists the next six dates and skips the 31st for 4-9", async () => {
    setKoreaTime("2026-10-24T03:00:00Z");
    render(<PatternDates pattern="4-9" />);
    const section = await screen.findByRole("region", { name: "다음 장날" });
    expect(within(section).getAllByRole("listitem").map((item) => item.querySelector("strong")!.textContent))
      .toEqual(["10/24(토)", "10/29(목)", "11/4(수)", "11/9(월)", "11/14(토)", "11/19(목)"]);
  });
});

describe("HubToday", () => {
  afterEach(() => vi.useRealTimers());

  it("links today's pattern page", async () => {
    setKoreaTime("2026-10-14T03:00:00Z");
    render(<HubToday markets={fixture} />);
    expect(await screen.findByRole("link", { name: /4·9일장 전국 목록 보기/ })).toHaveAttribute("href", "/jangnal/days/4-9");
  });
});
