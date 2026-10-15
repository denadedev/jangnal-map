import { describe, expect, it } from "vitest";

import { publicMarkets } from "./market-catalog";
import { regionEditorialEntries, validateRegionEditorial, type RegionEditorialContent } from "./region-editorial";

const gyeongbukMarket = publicMarkets.find((market) => market.name === "안강공설시장")!;
const gyeongbukMarket2 = publicMarkets.find((market) => market.name === "청도공설시장")!;
const seoulDaily = publicMarkets.find((market) => market.schedule.kind === "daily" && (market.roadAddress ?? "").startsWith("서울"))!;

const validEntry: RegionEditorialContent = {
  regionSlug: "gyeongbuk",
  summary: "요약",
  highlights: [{ marketId: gyeongbukMarket.id, note: "메모" }, { marketId: gyeongbukMarket2.id, note: "메모" }],
  visitTips: ["팁"],
  sources: [{ name: "출처", url: "https://www.data.go.kr/data/15012894/standard.do", checkedAt: "2026-10-15" }],
  reviewedAt: "2026-10-15",
  status: "reviewed",
};

describe("region editorial", () => {
  it("accepts a valid entry", () => {
    expect(validateRegionEditorial([validEntry], publicMarkets)).toEqual([]);
  });

  it("rejects duplicates, empty copy, foreign highlights and bad dates", () => {
    const errors = validateRegionEditorial([
      validEntry,
      { ...validEntry, summary: " ", reviewedAt: "2026/10/15", highlights: [{ marketId: seoulDaily.id, note: "x" }], visitTips: [], sources: [] },
    ], publicMarkets);

    expect(errors).toEqual(expect.arrayContaining([
      "duplicate regionSlug: gyeongbuk",
      "missing summary: gyeongbuk",
      "highlights must have 2-3 items: gyeongbuk",
      `highlight is not a periodic market in region: ${seoulDaily.id}`,
      "missing visitTips: gyeongbuk",
      "missing sources: gyeongbuk",
      "invalid reviewedAt: gyeongbuk",
    ]));
  });

  it("ships valid editorial data", () => {
    expect(validateRegionEditorial(regionEditorialEntries, publicMarkets)).toEqual([]);
  });
});
