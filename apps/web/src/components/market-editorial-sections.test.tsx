import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MarketEditorialContent } from "../lib/market-editorial";
import { MarketEditorialSections } from "./market-editorial-sections";

const editorial: MarketEditorialContent = {
  marketId: "reviewed-market",
  summary: "고유한 시장 설명",
  visitTips: ["장날 방문 팁"],
  transportation: "역에서 도보로 접근합니다.",
  parking: "공영주차장을 확인하세요.",
  specialties: ["지역 특산물"],
  nearbyMarketIds: [],
  sources: [{ name: "공식 출처", url: "https://example.com/source", checkedAt: "2026-09-21" }, { name: "공공데이터", url: "https://example.com/data", checkedAt: "2026-09-21" }],
  reviewedAt: "2026-09-21",
  status: "reviewed",
};

describe("MarketEditorialSections", () => {
  it("renders each reviewed content section and its sources", () => {
    render(<MarketEditorialSections editorial={editorial} />);

    expect(screen.getByRole("heading", { name: "한눈에 보는 시장 특징" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "방문 전에 알아둘 점" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "교통과 주차" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "대표 품목과 시장 특성" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "편집 출처" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "공식 출처" })).toHaveAttribute("href", "https://example.com/source");
  });
});
