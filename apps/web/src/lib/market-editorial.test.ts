import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";
import {
  findMarketEditorial,
  marketEditorialEntries,
  reviewedMarketIds,
  reviewedMarkets,
  validateMarketEditorial,
} from "./market-editorial";

describe("market editorial catalog", () => {
  it("contains the first reviewed market batch", () => {
    expect(marketEditorialEntries.map((entry) => entry.marketId)).toEqual(expect.arrayContaining([
      "market-46dd8e03711ba7b6",
      "market-c3983f871839ecc8",
      "market-389b4a24f06ccd11",
      "market-d8d1a37e4d63609b",
      "market-f9785614947c1065",
      "market-5207a19f315d3216",
      "market-a977f620b61db85b",
      "market-a096b1a38138db75",
      "market-46fa9022c9bff08d",
      "market-a3999c03b9b3e221",
    ]));
    expect(marketEditorialEntries).toHaveLength(10);
  });

  it("keeps each reviewed entry unique and connected to a public market", () => {
    expect(new Set(marketEditorialEntries.map((entry) => entry.marketId)).size)
      .toBe(marketEditorialEntries.length);

    for (const entry of marketEditorialEntries) {
      expect(publicMarkets.some((market) => market.id === entry.marketId)).toBe(true);
      expect(entry.status).toBe("reviewed");
      expect(entry.summary.trim().length).toBeGreaterThan(0);
      expect(entry.visitTips.length).toBeGreaterThan(0);
      expect(entry.transportation.trim().length).toBeGreaterThan(0);
      expect(entry.parking.trim().length).toBeGreaterThan(0);
      expect(entry.sources.length).toBeGreaterThanOrEqual(2);
      expect(new Set(entry.sources.map((source) => source.url)).size).toBe(entry.sources.length);
      expect(entry.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const nearbyId of entry.nearbyMarketIds) {
        expect(publicMarkets.some((market) => market.id === nearbyId)).toBe(true);
      }
      for (const source of entry.sources) {
        expect(new URL(source.url).protocol).toBe("https:");
        expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }

    for (const field of ["summary", "transportation", "parking"] as const) {
      const values = marketEditorialEntries.map((entry) => entry[field].trim());
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("exposes reviewed lookup collections", () => {
    expect(reviewedMarketIds.size).toBe(marketEditorialEntries.length);
    expect(reviewedMarkets.every((market) => reviewedMarketIds.has(market.id))).toBe(true);
    expect(findMarketEditorial("missing-market")).toBeUndefined();
  });

  it("reports invalid editorial records with explicit errors", () => {
    const market = publicMarkets[0];
    const invalid = {
      marketId: "missing-market",
      summary: "",
      visitTips: [],
      transportation: "",
      parking: "",
      specialties: [],
      nearbyMarketIds: ["missing-nearby"],
      sources: [
        { name: "bad", url: "http://example.com", checkedAt: "bad-date" },
        { name: "bad", url: "http://example.com", checkedAt: "bad-date" },
      ],
      reviewedAt: "bad-date",
      status: "reviewed" as const,
    };

    const errors = validateMarketEditorial([invalid], [market] as PublicMarket[]);

    expect(errors).toEqual(expect.arrayContaining([
      "unknown marketId: missing-market",
      "missing summary: missing-market",
      "missing visitTips: missing-market",
      "missing transportation: missing-market",
      "missing parking: missing-market",
      "unknown nearbyMarketId: missing-nearby",
      "source must use https: missing-market",
      "invalid reviewedAt: missing-market",
    ]));
  });
});
