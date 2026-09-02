import { describe, expect, it } from "vitest";

import { analyzeMarkets } from "../src/analyze.js";
import type { NormalizedMarket } from "../src/types.js";

const market = (overrides: Partial<NormalizedMarket>): NormalizedMarket => ({
  name: "기본시장",
  marketType: "상설장",
  roadAddress: "경기도 예시시 시장로 1",
  lotAddress: null,
  scheduleRaw: "매일",
  latitude: 37.5,
  longitude: 127,
  storeCount: 10,
  products: ["농산물"],
  hasParking: true,
  phone: "031-000-0000",
  homepageUrl: null,
  referenceDate: "2025-11-10",
  status: "운영",
  ...overrides,
});

describe("analyzeMarkets", () => {
  it("장날 후보·유효 좌표·해석 가능 일정·게시 가능 행을 구분한다", () => {
    const result = analyzeMarkets([
      market({ name: "정상오일장", marketType: "상설장+5일장", scheduleRaw: "1일+6일" }),
      market({ name: "상설시장" }),
      market({ name: "좌표누락", scheduleRaw: "2일+7일", latitude: null, longitude: null }),
      market({ name: "규칙예외", scheduleRaw: "2일+5일" }),
      market({ name: "범위이탈", scheduleRaw: "3일+8일", latitude: 10, longitude: 20 }),
    ]);

    expect(result).toMatchObject({
      totalRows: 5,
      dailyMarkets: 1,
      periodicCandidates: 4,
      validCoordinates: 2,
      parseableSchedules: 3,
      publishableRows: 1,
    });
    expect(result.unknownScheduleCounts).toEqual([{ raw: "2일+5일", count: 1 }]);
    expect(result.invalidCoordinateMarkets.map(({ name }) => name)).toEqual(["좌표누락", "범위이탈"]);
  });

  it("공백을 무시한 같은 시장명과 주소를 중복 후보로 묶는다", () => {
    const result = analyzeMarkets([
      market({ name: "예시 시장", roadAddress: "경기도 예시시 시장로 1" }),
      market({ name: "예시시장", roadAddress: "경기도 예시시 시장로1" }),
      market({ name: "다른시장", roadAddress: "경기도 예시시 시장로 1" }),
    ]);

    expect(result.duplicateCandidates).toEqual([
      {
        key: "예시시장|경기도예시시시장로1",
        names: ["예시 시장", "예시시장"],
      },
    ]);
  });
});
