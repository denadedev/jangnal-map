import { describe, expect, it } from "vitest";

import { publicMarkets } from "./market-catalog";
import { findRegionBySlug, getMarketDistrict, getMarketRegion, REGIONS } from "./region";

const periodicMarkets = publicMarkets.filter((market) => market.status === "운영" && market.schedule.kind === "digit-pair");

describe("region lookup", () => {
  it("counts operating digit-pair markets per launch region", () => {
    const counts: Record<string, number> = {};
    for (const market of periodicMarkets) {
      const slug = getMarketRegion(market)?.slug ?? "none";
      counts[slug] = (counts[slug] ?? 0) + 1;
    }

    expect(counts).toMatchObject({
      gyeongbuk: 79, gyeongnam: 69, jeonnam: 63, gyeonggi: 36,
      chungnam: 35, jeonbuk: 34, chungbuk: 31, gangwon: 23,
    });
  });

  it("assigns every operating digit-pair market to a region", () => {
    expect(periodicMarkets.filter((market) => getMarketRegion(market) === null)).toEqual([]);
  });

  it("maps the 전북특별차치도 typo to jeonbuk", () => {
    const market = periodicMarkets.find((item) => (item.roadAddress ?? item.lotAddress ?? "").startsWith("전북특별차치도"))!;
    expect(getMarketRegion(market)?.slug).toBe("jeonbuk");
  });

  it("returns the district from the address", () => {
    const market = periodicMarkets.find((item) => item.name === "안강공설시장")!;
    expect(getMarketDistrict(market)).toBe("경주시");
  });

  it("finds regions by slug only", () => {
    expect(REGIONS).toHaveLength(17);
    expect(findRegionBySlug("gyeongbuk")?.shortName).toBe("경북");
    expect(findRegionBySlug("경북")).toBeUndefined();
  });
});
