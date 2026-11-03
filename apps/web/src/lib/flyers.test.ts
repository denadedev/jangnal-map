import { describe, expect, it } from "vitest";

import { addDays, flyerDeleteBefore, flyerWeekOf, formatFlyerPeriod, isFlyerCurrent, koreaToday, parseIsoDate, validateFlyerUpload } from "./flyers";
import { currentFlyersKey, flyerEndingLabel } from "./this-week";

describe("flyer dates", () => {
  it("uses the Korean date across UTC midnight", () => {
    expect(koreaToday(new Date("2026-10-28T14:59:59Z"))).toBe("2026-10-28");
    expect(koreaToday(new Date("2026-10-28T15:00:00Z"))).toBe("2026-10-29");
  });

  it.each([
    ["2026-10-29", "2026-10-29"], // 목
    ["2026-10-30", "2026-10-29"],
    ["2026-11-04", "2026-10-29"], // 수
    ["2026-11-05", "2026-11-05"],
  ])("puts %s in the week starting %s", (today, start) => {
    expect(flyerWeekOf(today)).toEqual({ start, end: addDays(start, 6) });
  });

  it("shows a flyer through its end date and hides it the day after", () => {
    const flyer = { startsOn: "2026-10-29", endsOn: "2026-11-04" };
    expect(isFlyerCurrent(flyer, "2026-10-28")).toBe(false);
    expect(isFlyerCurrent(flyer, "2026-11-04")).toBe(true);
    expect(isFlyerCurrent(flyer, "2026-11-05")).toBe(false);
  });

  it("deletes flyers that ended more than 30 days ago", () => {
    expect(flyerDeleteBefore("2026-12-04")).toBe("2026-11-04");
  });

  it("rejects impossible dates and formats periods", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
    expect(formatFlyerPeriod("2026-10-29", "2026-11-04")).toBe("10/29~11/4");
  });
});

describe("validateFlyerUpload", () => {
  const ok = { brand: "homeplus", startsOn: "2026-10-29", endsOn: "2026-11-04", baseStoreName: "", imageCount: 3 };

  it("accepts a normal week and treats a blank store as nationwide", () => {
    expect(validateFlyerUpload(ok)).toEqual({ ok: true, input: { brand: "homeplus", startsOn: "2026-10-29", endsOn: "2026-11-04", baseStoreName: null } });
  });

  it("reports each bad field", () => {
    expect(validateFlyerUpload({ brand: "costco", startsOn: "2026-10-01", endsOn: "2026-11-04", baseStoreName: "가".repeat(31), imageCount: 11 })).toEqual({
      ok: false,
      errors: {
        brand: "브랜드를 골라 주세요.",
        ends_on: "행사 기간은 31일을 넘을 수 없어요.",
        base_store: "기준 매장은 30자 안으로 적어 주세요.",
        images: "이미지는 10장까지 올릴 수 있어요.",
      },
    });
  });
});

describe("flyerEndingLabel", () => {
  it("speaks only on the last two days of the flyer week", () => {
    expect(flyerEndingLabel("2026-11-04", "2026-11-04")).toBe("오늘 끝나요");
    expect(flyerEndingLabel("2026-11-03", "2026-11-04")).toBe("내일 끝나요");
    expect(flyerEndingLabel("2026-11-02", "2026-11-04")).toBeNull();
  });
});

describe("currentFlyersKey", () => {
  it("joins the ids of brands with a flyer and is null without one", () => {
    const brand = (id: string | null) => ({ code: "emart", name: "이마트", officialFlyerUrl: "https://example.com", flyer: id ? { id, startsOn: "2026-10-29", endsOn: "2026-11-04", baseStoreName: null, pages: [] } : null }) as Parameters<typeof currentFlyersKey>[0][number];
    expect(currentFlyersKey([brand("b"), brand(null), brand("a")])).toBe("a,b");
    expect(currentFlyersKey([brand(null)])).toBeNull();
  });
});
