import { describe, expect, it } from "vitest";

import { parseSchedule } from "../src/parse-schedule.js";

describe("parseSchedule", () => {
  it.each([
    ["1일+6일", [1, 6]],
    ["2일+7일", [2, 7]],
    ["3일+8일", [3, 8]],
    ["4일+9일", [4, 9]],
    ["5일+10일", [5, 10]],
    ["매월 1일·6일", [1, 6]],
    ["2·7일장", [2, 7]],
    ["매월 3일/8일", [3, 8]],
  ])("5일장 표현 %s를 두 날짜 규칙으로 분류한다", (raw, days) => {
    expect(parseSchedule(raw)).toEqual({ kind: "digit-pair", days });
  });

  it("매일을 상설 규칙으로 분류한다", () => {
    expect(parseSchedule("매일")).toEqual({ kind: "daily" });
  });

  it.each(["2일+5일", "2일+4일+7일+9일", "0일+5일", "32일+37일", "상황에 따라 운영", ""])(
    "근거 없이 해석할 수 없는 표현 %s를 검토 대상으로 남긴다",
    (raw) => {
      expect(parseSchedule(raw)).toEqual({ kind: "unknown", raw });
    },
  );
});
