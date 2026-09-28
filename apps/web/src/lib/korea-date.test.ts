import { describe, expect, it } from "vitest";

import { getKoreaCalendarDate, msUntilNextKoreaMidnight } from "./korea-date";

describe("Korean calendar day", () => {
  it("uses the next Korean day even when the UTC date has not changed", () => {
    const result = getKoreaCalendarDate(new Date("2026-09-28T15:01:00.000Z"));
    expect([result.getFullYear(), result.getMonth() + 1, result.getDate()]).toEqual([2026, 9, 29]);
  });

  it("schedules the Korean midnight boundary", () => {
    expect(msUntilNextKoreaMidnight(new Date("2026-09-28T14:59:00.000Z"))).toBe(60_000);
    expect(msUntilNextKoreaMidnight(new Date("2026-12-31T14:59:00.000Z"))).toBe(60_000);
  });

  it.each(["Asia/Seoul", "America/Los_Angeles", "Europe/London"])("uses the same Korean calendar day in %s", (timezone) => {
    const previous = process.env.TZ;
    try {
      process.env.TZ = timezone;
      const result = getKoreaCalendarDate(new Date("2026-12-31T15:01:00.000Z"));
      expect([result.getFullYear(), result.getMonth() + 1, result.getDate()]).toEqual([2027, 1, 1]);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
});
