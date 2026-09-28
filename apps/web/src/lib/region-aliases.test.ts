import { describe, expect, it } from "vitest";

import { resolveRegionAlias } from "./region-aliases";
import { publicMarkets } from "./market-catalog";

describe("English province search", () => {
  it("maps English names to Korean address prefixes", () => {
    expect(resolveRegionAlias("  SEOUL ")).toEqual(["서울특별시"]);
    expect(resolveRegionAlias("Jeju Island")).toEqual(["제주특별자치도"]);
    expect(resolveRegionAlias("Jeonbuk")).toContain("전북특별차치도");
  });

  it("does not mistake a Korean market name for a province", () => {
    expect(resolveRegionAlias("광장시장")).toBeNull();
    expect(resolveRegionAlias("unknown city")).toBeNull();
  });

  it("finds real markets for all 17 English province names", () => {
    const names = [
      "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan", "Sejong",
      "Gyeonggi", "Gangwon", "Chungbuk", "Chungnam", "Jeonbuk", "Jeonnam",
      "Gyeongbuk", "Gyeongnam", "Jeju",
    ];

    for (const name of names) {
      const prefixes = resolveRegionAlias(name);
      expect(prefixes, name).not.toBeNull();
      expect(publicMarkets.some((market) => prefixes!.some((prefix) =>
        (market.roadAddress ?? market.lotAddress ?? "").startsWith(prefix),
      )), name).toBe(true);
    }
  });
});
