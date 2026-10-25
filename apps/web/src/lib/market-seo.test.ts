import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";
import { createCatalog } from "./catalog/catalog";
import { createMarketScheduleAnswer, createMarketSeoText, createMarketSlug, getMarketPagePath } from "./market-seo";

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

const periodicEditorial = {
  marketId: periodicMarket.id, summary: "s", visitTips: ["t"], transportation: "t", parking: "p",
  specialties: [], nearbyMarketIds: [], sources: [], reviewedAt: "2026-10-01", status: "reviewed" as const,
};
const { findMarketBySlug, isMarketIndexable } = createCatalog({ markets: publicMarkets, editorial: [periodicEditorial], highlights: [] });

describe("market SEO identity", () => {
  it("creates a readable slug with a stable ID suffix", () => {
    expect(createMarketSlug(periodicMarket)).toBe("용인-중앙시장-389b4a24");
    expect(getMarketPagePath(periodicMarket)).toBe("/markets/용인-중앙시장-389b4a24");
  });

  it("creates one unique slug for every public market and resolves it", () => {
    const slugs = publicMarkets.map(createMarketSlug);

    expect(publicMarkets).toHaveLength(1_393);
    expect(new Set(slugs).size).toBe(1_393);
    expect(findMarketBySlug(slugs[0])?.id).toBe(publicMarkets[0].id);
  });

  it("resolves URL-encoded market path parameters", () => {
    expect(findMarketBySlug("%EC%9A%B4%EC%B2%9C%EC%A0%84%ED%86%B5%EC%8B%9C%EC%9E%A5-45b640cc")?.id)
      .toBe("market-45b640ccbe294100");
  });

  it("returns undefined for malformed URL-encoded market path parameters", () => {
    expect(findMarketBySlug("%")).toBeUndefined();
  });
});

describe("market SEO copy", () => {
  it("가맹점 수가 있는 시장은 온누리 검색 의도를 제목과 설명에 담는다", () => {
    const seo = createMarketSeoText({
      ...periodicMarket,
      onnuri: {
        totalCount: 83,
        digitalCount: 71,
        paperCount: 65,
        referenceDate: "2025-07-31",
        source: { name: "공공데이터포털", url: "https://www.data.go.kr/" },
      },
    });

    expect(seo.title).toBe("용인 중앙시장 장날 날짜 (5·10일장) | 오늘 장날");
    expect(seo.description).toContain("온누리상품권 가맹점 83곳");
    expect(seo.description).toContain("디지털 71곳·지류 65곳");
    expect(seo.description).toContain("5일·10일·15일·20일·25일·30일");
  });

  it("uses durable schedule facts instead of an exact next date", () => {
    expect(createMarketSeoText(periodicMarket)).toEqual({
      title: "용인 중앙시장 장날 날짜 (5·10일장) | 오늘 장날",
      description: "경기도 용인시 용인 중앙시장 장날은 매월 5일·10일·15일·20일·25일·30일입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.",
    });
  });

  it("names up to three approved visitor picks right after the schedule, skipping tips", () => {
    const pick = (name: string, category: "specialty" | "food" | "tip" | "sight") =>
      ({ marketId: periodicMarket.id, name, description: null, category, createdAt: "2026-10-21T00:00:00.000Z" });
    const seo = createMarketSeoText(periodicMarket, [pick("백암순대", "specialty"), pick("주차는 일찍", "tip"), pick("국밥", "food"), pick("호떡", "food"), pick("벽화길", "sight")]);

    expect(seo.description).toBe("경기도 용인시 용인 중앙시장 장날은 매월 5일·10일·15일·20일·25일·30일입니다. 방문자 추천: 백암순대·국밥·호떡. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.");
    expect(createMarketSeoText(periodicMarket, [pick("주차는 일찍", "tip")])).toEqual(createMarketSeoText(periodicMarket));
  });

  it("uses daily copy for permanent markets and noindexes unknown schedules", () => {
    const daily = { ...periodicMarket, scheduleRaw: "매일", schedule: { kind: "daily" as const } };
    const unknown = { ...periodicMarket, scheduleRaw: "확인 중", schedule: { kind: "unknown" as const, raw: "확인 중" } };
    const closed = { ...periodicMarket, status: "폐장" as const };

    expect(createMarketSeoText(daily).title).toBe("용인 중앙시장 영업일 · 상설시장 | 오늘 장날");
    expect(createMarketSeoText(daily).description).toContain("휴무");
    expect(createMarketScheduleAnswer(daily)).toBe("용인 중앙시장은 상설시장입니다. 점포별 영업일과 정기휴무는 방문 전 확인하세요.");
    const withOnnuri = { ...daily, onnuri: publicMarkets.find((market) => market.onnuri)?.onnuri ?? null };
    expect(createMarketSeoText(withOnnuri).title).toContain("상설시장");
    expect(createMarketSeoText(withOnnuri).description).toContain("휴무");
    expect(isMarketIndexable(daily)).toBe(true);
    expect(isMarketIndexable(unknown)).toBe(false);
    expect(isMarketIndexable(closed)).toBe(false);
  });
});
