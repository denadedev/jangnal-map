import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketNextDate } from "./market-next-date";

const periodicMarket: PublicMarket = {
  id: "market-389b4a24f06ccd11",
  name: "용인 중앙시장",
  marketType: "상설장+5일장",
  roadAddress: "경기도 용인시 처인구 금령로107번길 13",
  lotAddress: null,
  latitude: 37.235,
  longitude: 127.209,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: true,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "공공데이터포털", url: "https://www.data.go.kr/", referenceDate: "2025-11-10" },
};

describe("MarketNextDate", () => {
  afterEach(() => vi.useRealTimers());

  it("replaces the durable schedule fallback with the next date from the browser clock", async () => {
    const staticMarkup = renderToStaticMarkup(<MarketNextDate market={periodicMarket} />);

    expect(staticMarkup).toContain("5·10일장");
    expect(staticMarkup).not.toContain("9월 10일 목요일");
    expect(staticMarkup).not.toContain("D-3");

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 7, 12));

    render(<MarketNextDate market={periodicMarket} />);

    expect(screen.getByText("9월 10일 목요일")).toBeInTheDocument();
    expect(screen.getByText("D-3")).toBeInTheDocument();
  });
});
