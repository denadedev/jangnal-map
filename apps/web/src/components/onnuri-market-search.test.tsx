import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { OnnuriMarketSearch } from "./onnuri-market-search";

const baseMarket: PublicMarket = {
  id: "market-45b640ccbe294100",
  name: "운천전통시장",
  marketType: "상설장+4일장",
  roadAddress: "경기도 포천시 영북면 영북로 177번길 25",
  lotAddress: null,
  latitude: 38.08,
  longitude: 127.27,
  scheduleRaw: "4일+9일",
  schedule: { kind: "digit-pair", days: [4, 9] },
  phone: null,
  hasParking: true,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  onnuri: {
    totalCount: 83,
    digitalCount: 71,
    paperCount: 65,
    referenceDate: "2025-07-31",
    source: { name: "공공데이터포털", url: "https://www.data.go.kr/" },
  },
  source: { name: "공공데이터포털", url: "https://www.data.go.kr/", referenceDate: "2025-11-10" },
};

const markets = [
  baseMarket,
  { ...baseMarket, id: "market-no-data", name: "포천미확인시장", onnuri: null },
  { ...baseMarket, id: "market-other", name: "통복시장", roadAddress: "경기도 평택시 통복동", onnuri: { ...baseMarket.onnuri!, totalCount: 20 } },
];

describe("OnnuriMarketSearch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => markets }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("시장명과 지역으로 수치가 확인된 시장을 검색한다", async () => {
    const user = userEvent.setup();
    render(<OnnuriMarketSearch />);

    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "포천");

    expect(await screen.findByRole("link", { name: /운천전통시장/ })).toHaveAttribute(
      "href",
      "/markets/운천전통시장-45b640cc",
    );
    expect(screen.getByText("전체 83곳")).toBeInTheDocument();
    expect(screen.queryByText("포천미확인시장")).not.toBeInTheDocument();
  });

  it("검색 결과가 없으면 명확한 빈 상태를 보여준다", async () => {
    const user = userEvent.setup();
    render(<OnnuriMarketSearch />);

    await user.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "없는지역");

    expect(await screen.findByText("조건에 맞는 온누리상품권 가맹 시장이 없어요")).toBeInTheDocument();
  });
});
