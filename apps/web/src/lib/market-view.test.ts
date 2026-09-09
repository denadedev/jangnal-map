import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { filterMarkets, formatDistance, formatMarketTiming, formatSchedulePattern, getDateRange, normalizeDirectDate, sortMarketsByDistance } from "./market-view";

const market: PublicMarket = {
  id: "market",
  name: "테스트시장",
  marketType: "정기시장",
  roadAddress: null,
  lotAddress: null,
  latitude: 37,
  longitude: 127,
  scheduleRaw: "2일+7일",
  schedule: { kind: "digit-pair", days: [2, 7] },
  phone: null,
  hasParking: null,
  referenceDate: null,
  status: "운영",
  statusVerified: true,
  onnuri: null,
  source: { name: "테스트", url: "https://example.com", referenceDate: null },
};

describe("market explorer date semantics", () => {
  it("sorts markets by straight-line distance and keeps missing coordinates last", () => {
    const sorted = sortMarketsByDistance([
      { ...market, id: "far", latitude: 35.1796, longitude: 129.0756 },
      { ...market, id: "missing", latitude: null, longitude: null },
      { ...market, id: "near", latitude: 37.57, longitude: 126.99 },
    ], { latitude: 37.5665, longitude: 126.978 });

    expect(sorted.map((item) => item.id)).toEqual(["near", "far", "missing"]);
  });

  it("formats nearby distances in meters and longer distances in kilometers", () => {
    expect(formatDistance(0.42)).toBe("420m");
    expect(formatDistance(2.34)).toBe("2.3km");
  });

  it("formats normalized schedule patterns for list tags", () => {
    expect(formatSchedulePattern(market)).toBe("2·7일장");
    expect(formatSchedulePattern({ ...market, scheduleRaw: "5일+10일", schedule: { kind: "digit-pair", days: [5, 0] } })).toBe("5·10일장");
    expect(formatSchedulePattern({ ...market, scheduleRaw: "매일", schedule: { kind: "daily" } })).toBe("매일");
    expect(formatSchedulePattern({ ...market, scheduleRaw: "확인 중", schedule: { kind: "unknown", raw: "확인 중" } })).toBe("일정 확인");
  });

  it("uses all markets without a date range and treats this week as the next seven days", () => {
    const sunday = new Date(2026, 8, 6);

    expect(getDateRange("all", sunday, "2026-09-06")).toBeNull();
    expect(getDateRange("week", sunday, "2026-09-06")).toEqual({
      start: new Date(2026, 8, 6),
      end: new Date(2026, 8, 12),
    });
    expect(getDateRange("weekend", sunday, "2026-09-06")).toEqual({
      start: new Date(2026, 8, 12),
      end: new Date(2026, 8, 13),
    });
  });

  it("includes every schedule in all mode and excludes unknown schedules from dated modes", () => {
    const daily = { ...market, id: "daily", scheduleRaw: "매일", schedule: { kind: "daily" as const } };
    const unknown = { ...market, id: "unknown", scheduleRaw: "확인 중", schedule: { kind: "unknown" as const, raw: "확인 중" } };

    expect(filterMarkets([market, daily, unknown], "", null)).toHaveLength(3);
    expect(filterMarkets([market, daily, unknown], "", {
      start: new Date(2026, 8, 8),
      end: new Date(2026, 8, 8),
    })).toEqual([daily]);
  });

  it("can exclude daily markets from jangnal-only date ranges", () => {
    const daily = { ...market, id: "daily", scheduleRaw: "매일", schedule: { kind: "daily" as const } };
    const range = { start: new Date(2026, 8, 7), end: new Date(2026, 8, 7) };

    expect(filterMarkets([market, daily], "", range, { includeDaily: false })).toEqual([market]);
  });

  it("shows an upcoming market day during the next seven days", () => {
    const today = new Date(2026, 8, 8);
    const range = getDateRange("week", today, "2026-09-08");
    const results = filterMarkets([market], "", range);

    expect(range).toEqual({ start: new Date(2026, 8, 8), end: new Date(2026, 8, 14) });
    expect(results).toEqual([market]);
    expect(formatMarketTiming(results[0], range!.start)).toBe("9/12");
  });

  it("clamps empty, malformed, and past direct dates to today", () => {
    const today = new Date(2026, 8, 8);

    expect(normalizeDirectDate("", today)).toEqual(today);
    expect(normalizeDirectDate("2026-09-99", today)).toEqual(today);
    expect(normalizeDirectDate("2026-09-07", today)).toEqual(today);
  });
});
