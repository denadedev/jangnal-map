import { describe, expect, it } from "vitest";

import type { PublicMarket } from "../lib/market";
import { publicMarkets } from "../lib/market-catalog";
import type { MarketEditorialContent } from "../lib/market-editorial";
import { marketEditorialEntries } from "../lib/market-editorial";
import { buildSeedRows } from "./seed-rows";

const source = { name: "공공데이터포털 전국전통시장표준데이터", url: "https://www.data.go.kr/data/15012894/standard.do", referenceDate: "2025-11-10" };

const market = (overrides: Partial<PublicMarket>): PublicMarket => ({
  id: "market-0000000000000001",
  name: "북평민속시장",
  marketType: "상설장+5일장",
  roadAddress: "강원특별자치도 동해시 오일장길 32",
  lotAddress: null,
  latitude: 37.48,
  longitude: 129.12,
  scheduleRaw: "3일+8일",
  schedule: { kind: "digit-pair", days: [3, 8] },
  phone: null,
  hasParking: true,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source,
  ...overrides,
});

const guide = (overrides: Partial<MarketEditorialContent>): MarketEditorialContent => ({
  marketId: "market-0000000000000001",
  summary: "요약",
  visitTips: ["팁"],
  transportation: "교통",
  parking: "주차",
  specialties: ["소머리국밥", "해산물"],
  nearbyMarketIds: [],
  sources: [{ name: "전국전통시장표준데이터", url: source.url, checkedAt: "2026-10-15" }],
  reviewedAt: "2026-10-15",
  status: "reviewed",
  ...overrides,
});

describe("buildSeedRows", () => {
  it("converts the current JSON without validation errors", () => {
    const { rows, errors } = buildSeedRows(publicMarkets, marketEditorialEntries);
    expect(errors).toEqual([]);
    expect(rows.markets).toHaveLength(publicMarkets.length);
    expect(rows.marketGuides).toHaveLength(marketEditorialEntries.length);
    expect(new Set(rows.markets.map((row) => row.slug)).size).toBe(publicMarkets.length);
  });

  it("stores code values and keeps the legacy id and slug", () => {
    const { rows } = buildSeedRows([market({})], []);
    expect(rows.markets[0]).toMatchObject({
      legacyId: "market-0000000000000001",
      slug: "북평민속시장-00000000",
      marketType: "permanent-periodic-5",
      status: "open",
    });
    expect(rows.marketDistricts).toEqual([expect.objectContaining({ regionCode: "gangwon", name: "동해시" })]);
    expect(rows.marketScheduleDays.map((row) => row.dayDigit)).toEqual([3, 8]);
  });

  it("groups address typos and Sejong towns into one district", () => {
    const { rows } = buildSeedRows([
      market({ id: "market-a", roadAddress: "전북특별차치도 남원시 용성로 1" }),
      market({ id: "market-b", roadAddress: "전북특별자치도 남원시 용성로 2" }),
      market({ id: "market-c", roadAddress: "세종특별자치시 조치원읍 1" }),
      market({ id: "market-d", roadAddress: "세종특별자치시 부강면 2" }),
    ], []);
    expect(rows.marketDistricts.map(({ regionCode, name }) => `${regionCode}|${name}`).sort())
      .toEqual(["jeonbuk|남원시", "sejong|세종특별자치시"]);
  });

  it("merges one URL used under two names, preferring the market data name", () => {
    const { rows } = buildSeedRows([market({})], [guide({})]);
    expect(rows.sources).toEqual([expect.objectContaining({ url: source.url, name: source.name })]);
    expect(rows.marketGuideSources[0].sourceId).toBe(rows.sources[0].id);
  });

  it("keeps tips in order and reports specialties without a category", () => {
    const { rows, errors } = buildSeedRows([market({})], [guide({ visitTips: ["첫째", "둘째"] })]);
    expect(rows.marketHighlights).toEqual([]);
    expect(errors).toEqual([
      "missing highlight category: market-0000000000000001 소머리국밥",
      "missing highlight category: market-0000000000000001 해산물",
    ]);
    expect(rows.marketGuideTips.map(({ body, position }) => [body, position])).toEqual([["첫째", 0], ["둘째", 1]]);
  });

  it("reports rules the database cannot enforce", () => {
    const { errors } = buildSeedRows([
      market({ marketType: "7일장" }),
      market({ id: "market-x", schedule: { kind: "digit-pair", days: [4, 4] } }),
      market({ id: "market-y", roadAddress: "어딘가 1", lotAddress: null }),
    ], [guide({ visitTips: [] })]);
    expect(errors).toEqual(expect.arrayContaining([
      "unknown marketType: market-0000000000000001 7일장",
      "digit-pair needs two distinct days: market-x",
      "unknown region: market-y",
    ]));
    expect(errors.some((error) => error.includes("market-0000000000000001") && error.includes("visitTips"))).toBe(true);
  });
});
