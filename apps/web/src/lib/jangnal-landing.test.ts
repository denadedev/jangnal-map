import { describe, expect, it } from "vitest";

import {
  DAY_PATTERNS,
  findDayPattern,
  formatPatternLabel,
  getMarketsOpenOn,
  getMonthCalendar,
  getNextOpenDate,
  getPatternForDate,
  getPatternOf,
  groupByDistrict,
  groupByRegion,
} from "./jangnal-landing";
import { createCatalog } from "./catalog/catalog";
import { loadJsonSnapshot } from "./catalog/json-source";

const { getPatternMarkets, getRegionMarkets, periodicMarkets } = createCatalog(loadJsonSnapshot());

describe("jangnal landing data", () => {
  it("matches 5-10 to days [5, 0] regardless of order", () => {
    expect(getPatternOf({ schedule: { kind: "digit-pair", days: [5, 0] } })).toBe("5-10");
    expect(getPatternOf({ schedule: { kind: "digit-pair", days: [0, 5] } })).toBe("5-10");
    expect(getPatternOf({ schedule: { kind: "digit-pair", days: [4, 9] } })).toBe("4-9");
    expect(getPatternOf({ schedule: { kind: "daily" } })).toBeNull();
  });

  it("counts patterns nationwide", () => {
    expect(DAY_PATTERNS.map((pattern) => getPatternMarkets(pattern).length)).toEqual([66, 87, 84, 87, 85]);
  });

  it("maps each date to the pattern whose market opens that day", () => {
    expect(getPatternForDate(new Date(2026, 9, 14))).toBe("4-9");
    expect(getPatternForDate(new Date(2026, 9, 20))).toBe("5-10");
    expect(getPatternForDate(new Date(2026, 9, 31))).toBe("1-6");
    expect(formatPatternLabel("5-10")).toBe("5·10일장");
    expect(findDayPattern("1-2")).toBeUndefined();
  });

  it("opens 4-9 markets in Gyeongbuk on 2026-10-14", () => {
    const open = getMarketsOpenOn(getRegionMarkets("gyeongbuk"), new Date(2026, 9, 14));
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((market) => getPatternOf(market) === "4-9")).toBe(true);
    expect(open.some((market) => market.name === "안강공설시장")).toBe(true);
  });

  it("excludes skipsFirstAfterThirtyFirst markets on Nov 1 after Oct 31", () => {
    const skipping = periodicMarkets.find((market) => market.schedule.kind === "digit-pair" && market.schedule.skipsFirstAfterThirtyFirst)!;
    expect(getMarketsOpenOn([skipping], new Date(2026, 9, 31))).toEqual([skipping]);
    expect(getMarketsOpenOn([skipping], new Date(2026, 10, 1))).toEqual([]);
  });

  it("builds a 31-day October calendar whose counts match getMarketsOpenOn", () => {
    const markets = getRegionMarkets("gyeongbuk");
    const calendar = getMonthCalendar(markets, 2026, 9);
    expect(calendar).toHaveLength(31);
    expect(calendar[13]).toMatchObject({ pattern: "4-9", count: getMarketsOpenOn(markets, new Date(2026, 9, 14)).length });
    expect(getMonthCalendar(markets, 2026, 1)).toHaveLength(28);
  });

  it("finds the earliest next open date", () => {
    const markets = getPatternMarkets("4-9");
    expect(getNextOpenDate(markets, new Date(2026, 9, 15))).toEqual(new Date(2026, 9, 19));
    expect(getNextOpenDate([], new Date(2026, 9, 15))).toBeNull();
  });

  it("groups districts and regions in a stable order", () => {
    const districts = groupByDistrict(getRegionMarkets("gyeongbuk")).map(({ district }) => district);
    expect(districts).toEqual([...districts].sort((a, b) => a.localeCompare(b, "ko-KR")));
    expect(districts).toContain("경주시");
    expect(groupByRegion(getPatternMarkets("4-9")).reduce((sum, group) => sum + group.markets.length, 0)).toBe(87);
  });
});
