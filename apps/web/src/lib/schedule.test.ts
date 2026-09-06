import { describe, expect, it } from "vitest";

import { getMarketDates, getNextMarketDate } from "./schedule";

const market = (days: [number, number]) => ({ schedule: { kind: "digit-pair" as const, days } });

const dateParts = (dates: Date[]) => dates.map((date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()]);

describe("getMarketDates", () => {
  it("returns every day for daily markets and no dates for unknown schedules", () => {
    const range = { start: new Date(2026, 8, 7), end: new Date(2026, 8, 9) };

    expect(getMarketDates({ schedule: { kind: "daily" as const } }, range)).toEqual([
      new Date(2026, 8, 7),
      new Date(2026, 8, 8),
      new Date(2026, 8, 9),
    ]);
    expect(getMarketDates({ schedule: { kind: "unknown" as const, raw: "2일+4일+7일+9일" } }, range)).toEqual([]);
  });

  it("returns 1 and 6 ending market days within an inclusive range", () => {
    const dates = getMarketDates(market([1, 6]), {
      start: new Date(2026, 0, 1),
      end: new Date(2026, 0, 16),
    });

    expect(dateParts(dates)).toEqual([
      [2026, 1, 1],
      [2026, 1, 6],
      [2026, 1, 11],
      [2026, 1, 16],
    ]);
  });

  it("treats a schedule ending of 0 as the 10th, 20th, and 30th", () => {
    const dates = getMarketDates(market([5, 0]), {
      start: new Date(2026, 0, 1),
      end: new Date(2026, 0, 31),
    });

    expect(dateParts(dates)).toEqual([
      [2026, 1, 5],
      [2026, 1, 10],
      [2026, 1, 15],
      [2026, 1, 20],
      [2026, 1, 25],
      [2026, 1, 30],
    ]);
  });

  it("does not create a 30th day in February for a 5 and 0 schedule", () => {
    const dates = getMarketDates(market([5, 0]), {
      start: new Date(2026, 1, 25),
      end: new Date(2026, 2, 2),
    });

    expect(dateParts(dates)).toEqual([[2026, 2, 25]]);
  });

  it("includes February 29 when a leap year has a matching ending", () => {
    const dates = getMarketDates(market([4, 9]), {
      start: new Date(2028, 1, 27),
      end: new Date(2028, 2, 1),
    });

    expect(dateParts(dates)).toEqual([[2028, 2, 29]]);
  });
});

describe("getNextMarketDate", () => {
  it("uses today for daily markets and no date for unknown schedules", () => {
    const from = new Date(2026, 8, 7);

    expect(getNextMarketDate({ schedule: { kind: "daily" as const } }, from)).toEqual(from);
    expect(getNextMarketDate({ schedule: { kind: "unknown" as const, raw: "확인 중" } }, from)).toBeNull();
  });

  it("crosses a year boundary to find the next market day", () => {
    expect(getNextMarketDate(market([2, 7]), new Date(2026, 11, 31))).toEqual(new Date(2027, 0, 2));
  });

  it("includes the starting day when it is a market day", () => {
    expect(getNextMarketDate(market([1, 6]), new Date(2027, 0, 1))).toEqual(new Date(2027, 0, 1));
  });
});
