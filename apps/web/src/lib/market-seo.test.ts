import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";
import { createMarketSeoText, createMarketSlug, findMarketBySlug, getMarketPagePath, isMarketIndexable } from "./market-seo";

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
  source: { name: "공공데이터포털", url: "https://www.data.go.kr/", referenceDate: "2025-11-10" },
};

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
});

describe("market SEO copy", () => {
  it("uses durable schedule facts instead of an exact next date", () => {
    expect(createMarketSeoText(periodicMarket)).toEqual({
      title: "용인 중앙시장 장날 · 5·10일장 | 오늘 장날",
      description: "경기도 용인시 용인 중앙시장은 5·10일장입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.",
    });
  });

  it("uses daily copy for permanent markets and noindexes unknown schedules", () => {
    const daily = { ...periodicMarket, scheduleRaw: "매일", schedule: { kind: "daily" as const } };
    const unknown = { ...periodicMarket, scheduleRaw: "확인 중", schedule: { kind: "unknown" as const, raw: "확인 중" } };
    const closed = { ...periodicMarket, status: "폐장" as const };

    expect(createMarketSeoText(daily).title).toBe("용인 중앙시장 영업일 · 매일 운영 | 오늘 장날");
    expect(isMarketIndexable(daily)).toBe(true);
    expect(isMarketIndexable(unknown)).toBe(false);
    expect(isMarketIndexable(closed)).toBe(false);
  });
});
