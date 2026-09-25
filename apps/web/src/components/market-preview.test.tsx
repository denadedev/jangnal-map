import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketPreview } from "./market-preview";

const market: PublicMarket = {
  id: "preview-market",
  name: "미리보기시장",
  marketType: "5일장",
  roadAddress: "서울특별시 중구 시장길 1",
  lotAddress: "서울특별시 중구 시장동 1",
  latitude: 37.5,
  longitude: 127,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: null,
  referenceDate: "2026-09-01",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "출처", url: "https://example.com", referenceDate: "2026-09-01" },
};

describe("MarketPreview", () => {
  it("shows the next 5-day market date and opens the full detail", async () => {
    const user = userEvent.setup();
    const onOpenDetail = vi.fn();
    render(<MarketPreview market={market} today={new Date(2026, 8, 4)} onOpenDetail={onOpenDetail} />);

    expect(screen.getByText("다음 장날")).toBeInTheDocument();
    expect(screen.getByText("9월 5일 토요일 · D-1")).toBeInTheDocument();
    expect(screen.getByText("서울특별시 중구 시장길 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "상세 보기" }));
    expect(onOpenDetail).toHaveBeenCalledOnce();
  });

  it("marks today as the market day", () => {
    render(<MarketPreview market={market} today={new Date(2026, 8, 5)} onOpenDetail={() => undefined} />);
    expect(screen.getByText("9월 5일 토요일 · 오늘 장날")).toBeInTheDocument();
  });

  it.each([
    [{ ...market, schedule: { kind: "daily" as const }, roadAddress: null }, "운영 일정", "매일 운영", "서울특별시 중구 시장동 1"],
    [{ ...market, schedule: { kind: "unknown" as const, raw: "확인 중" }, roadAddress: null, lotAddress: null }, "운영 일정", "운영 일정 확인 필요", "주소 정보 없음"],
  ])("handles a non-5-day schedule and missing address with readable fallback", (marketVariant, label, schedule, address) => {
    render(<MarketPreview market={marketVariant} today={new Date(2026, 8, 5)} onOpenDetail={() => undefined} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(schedule)).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
  });
});
