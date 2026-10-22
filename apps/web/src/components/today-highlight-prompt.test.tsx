import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { publicMarkets } from "../lib/market-catalog";
import { findNearbyMarkets, MapParticipateButton, TodayHighlightPrompt } from "./today-highlight-prompt";

const base = publicMarkets.find((market) => market.schedule.kind === "digit-pair")!;
const make = (id: string, name: string, days: [number, number], roadAddress: string): PublicMarket =>
  ({ ...base, id, name, roadAddress, schedule: { kind: "digit-pair", days } });
const markets = [
  make("a", "정선아리랑시장", [2, 7], "강원특별자치도 정선군 정선읍 1"),
  make("b", "정선 임계시장", [5, 10], "강원특별자치도 정선군 임계면 2"),
  make("c", "원주풍물시장", [2, 7], "강원특별자치도 원주시 3"),
  { ...make("d", "상설시장", [2, 7], "강원특별자치도 정선군 4"), schedule: { kind: "daily" as const } },
];
const today = new Date(2026, 9, 22);
const umami = { track: vi.fn() };

beforeEach(() => {
  (window as unknown as { umami: typeof umami }).umami = umami;
  umami.track.mockClear();
  window.localStorage.clear();
});

describe("TodayHighlightPrompt", () => {
  it("lets a visitor pick today's market and write about it", async () => {
    render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "알려 주기" }));

    const picker = screen.getByRole("dialog", { name: "어느 장이었나요?" });
    expect(within(picker).getByText(/오늘 열린 장 2곳/)).toBeInTheDocument();
    expect(within(picker).queryByText("상설시장")).not.toBeInTheDocument();
    await userEvent.type(within(picker).getByRole("searchbox"), "원주");
    expect(within(picker).queryByText("정선아리랑시장")).not.toBeInTheDocument();
    await userEvent.click(within(picker).getByRole("button", { name: /원주풍물시장/ }));

    const sheet = screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" });
    expect(within(sheet).getByText("원주풍물시장")).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "map_today" });

    await userEvent.click(within(sheet).getByRole("button", { name: "바꾸기" }));
    expect(screen.getByRole("dialog", { name: "어느 장이었나요?" })).toBeInTheDocument();
  });

  it("stays hidden for the rest of the day once dismissed", async () => {
    const { unmount } = render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByText("오늘 열린 장 다녀오셨나요?")).not.toBeInTheDocument();
    unmount();

    render(<TodayHighlightPrompt markets={markets} today={today} currentLocation={null} />);
    expect(screen.queryByText("오늘 열린 장 다녀오셨나요?")).not.toBeInTheDocument();
    render(<TodayHighlightPrompt markets={markets} today={new Date(2026, 9, 27)} currentLocation={null} />);
    expect(screen.getByText("오늘 열린 장 다녀오셨나요?")).toBeInTheDocument();
  });

  it("does not show on days without a five-day market", () => {
    const { container } = render(<TodayHighlightPrompt markets={markets} today={new Date(2026, 9, 24)} currentLocation={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("MapParticipateButton", () => {
  it("asks about today's market and still finds other markets by search", async () => {
    render(<MapParticipateButton markets={markets} today={today} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "오늘 장 꿀팁 한 줄 남기기" }));
    expect(umami.track).toHaveBeenCalledWith("highlight_map_button_open", { today: "yes" });

    const picker = screen.getByRole("dialog", { name: "어느 장이었나요?" });
    expect(within(picker).queryByText("정선 임계시장")).not.toBeInTheDocument();
    await userEvent.type(within(picker).getByRole("searchbox"), "정선");
    const rows = within(picker).getAllByRole("button", { name: /정선/ }).map((row) => row.textContent);
    expect(rows[0]).toContain("정선아리랑시장");
    expect(rows[0]).toContain("오늘 열림");
    expect(rows.some((row) => row?.includes("정선 임계시장"))).toBe(true);

    await userEvent.click(within(picker).getByRole("button", { name: /정선 임계시장/ }));
    expect(within(screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" })).getByText("정선 임계시장")).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "map_button" });
  });

  it("invites a story on days without a five-day market", async () => {
    render(<MapParticipateButton markets={markets} today={new Date(2026, 9, 24)} currentLocation={null} />);
    await userEvent.click(screen.getByRole("button", { name: "단골 장 꿀팁 남기기" }));
    expect(screen.getByText("시장 이름이나 지역으로 찾아 주세요")).toBeInTheDocument();
  });
});

describe("findNearbyMarkets", () => {
  it("returns other markets in the same city or county", () => {
    expect(findNearbyMarkets(markets[0], markets).map((market) => market.name)).toEqual(["정선 임계시장", "상설시장"]);
  });
});
