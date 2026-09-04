import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { filterMarkets, formatPinDate, getDateRange, normalizeDirectDate } from "./market-view";

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
  source: { name: "테스트", url: "https://example.com", referenceDate: null },
};

describe("market explorer date semantics", () => {
  it("shows only an upcoming market day during the current week", () => {
    const today = new Date(2026, 8, 8);
    const range = getDateRange("week", today, "2026-09-08");
    const results = filterMarkets([market], "", range);

    expect(range).toEqual({ start: new Date(2026, 8, 8), end: new Date(2026, 8, 13) });
    expect(results).toEqual([market]);
    expect(formatPinDate(results[0], range.start)).toBe("9/12");
  });

  it("clamps empty, malformed, and past direct dates to today", () => {
    const today = new Date(2026, 8, 8);

    expect(normalizeDirectDate("", today)).toEqual(today);
    expect(normalizeDirectDate("2026-09-99", today)).toEqual(today);
    expect(normalizeDirectDate("2026-09-07", today)).toEqual(today);
  });
});
