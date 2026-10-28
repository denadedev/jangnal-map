import { describe, expect, it } from "vitest";

import { formatStoryAge } from "./market-highlight";

describe("formatStoryAge", () => {
  const now = new Date("2026-10-28T03:00:00Z");
  it("counts minutes as 방금, then hours and days", () => {
    expect(formatStoryAge("2026-10-28T02:30:00Z", now)).toBe("방금");
    expect(formatStoryAge("2026-10-27T22:00:00Z", now)).toBe("5시간 전");
    expect(formatStoryAge("2026-10-25T03:00:00Z", now)).toBe("3일 전");
  });

  it("writes the Korean date after a month", () => {
    expect(formatStoryAge("2026-09-20T16:00:00Z", now)).toBe("9/21");
  });
});
