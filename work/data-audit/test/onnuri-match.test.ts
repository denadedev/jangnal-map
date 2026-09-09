import { describe, expect, it } from "vitest";

import type { PublicMarket } from "../src/generate-public-markets.js";
import { matchOnnuriMarkets, renderOnnuriMatchReport } from "../src/onnuri-match.js";
import type { OnnuriMarketAggregate } from "../src/onnuri.js";

const market = (id: string, name: string, roadAddress: string): PublicMarket => ({
  id,
  name,
  marketType: "상설장",
  roadAddress,
  lotAddress: null,
  latitude: null,
  longitude: null,
  scheduleRaw: "매일",
  schedule: { kind: "daily" },
  phone: null,
  hasParking: null,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "공공데이터포털", url: "https://www.data.go.kr/", referenceDate: "2025-11-10" },
});

const markets = [
  market("uncheon", "운천전통시장", "경기도 포천시 영북면 시장길 1"),
  market("jecheon-central", "중앙시장", "충청북도 제천시 중앙로 1"),
  market("seoul-central", "중앙시장", "서울특별시 중구 시장길 1"),
];

const aggregate = (
  marketName: string,
  marketKey: string,
  region: string,
  totalCount = 2,
): OnnuriMarketAggregate => ({
  marketName,
  marketKey,
  region,
  totalCount,
  digitalCount: totalCount,
  paperCount: 1,
});

describe("온누리 시장 매칭", () => {
  it("시장명과 시군구가 맞는 하나의 시장에만 자동 연결한다", () => {
    const result = matchOnnuriMarkets(
      markets,
      [
        aggregate("운천전통시장", "운천", "경기도 포천시"),
        aggregate("중앙시장", "중앙", "", 5),
        aggregate("없는시장", "없는", "강원특별자치도 원주시"),
      ],
      {},
      "2025-07-31",
    );

    expect(result.summariesByMarketId.get("uncheon")?.totalCount).toBe(2);
    expect(result.report.autoMatches).toBe(1);
    expect(result.report.conflicts).toEqual([
      expect.objectContaining({ marketName: "중앙시장", candidateIds: ["jecheon-central", "seoul-central"] }),
    ]);
    expect(result.report.unmatched).toEqual([
      expect.objectContaining({ marketName: "없는시장" }),
    ]);
  });

  it("공식 원본의 광역지역 약칭을 시장 주소의 광역지역과 비교한다", () => {
    const result = matchOnnuriMarkets(
      markets,
      [aggregate("운천전통시장", "운천", "경기")],
      {},
      "2025-07-31",
    );

    expect(result.summariesByMarketId.get("uncheon")?.totalCount).toBe(2);
    expect(result.report.autoMatches).toBe(1);
  });

  it("검증된 수동 매핑으로 이름이 다른 시장을 연결한다", () => {
    const result = matchOnnuriMarkets(
      markets,
      [aggregate("운천장", "운천장", "경기도 포천시", 3)],
      { "경기도 포천시|운천장": "uncheon" },
      "2025-07-31",
    );

    expect(result.summariesByMarketId.get("uncheon")?.totalCount).toBe(3);
    expect(result.report.manualMatches).toBe(1);
  });

  it("존재하지 않는 내부 시장을 가리키는 수동 매핑을 거부한다", () => {
    expect(() => matchOnnuriMarkets(
      markets,
      [aggregate("운천장", "운천장", "경기도 포천시")],
      { "경기도 포천시|운천장": "missing" },
      "2025-07-31",
    )).toThrow("수동 매핑 대상 시장이 없습니다: missing");
  });

  it("집계와 제외 행을 사람이 검토할 수 있는 보고서로 만든다", () => {
    const result = matchOnnuriMarkets(markets, [aggregate("운천전통시장", "운천", "경기도 포천시")], {}, "2025-07-31");
    const report = renderOnnuriMatchReport(result.report, [
      { rowNumber: 9, field: "지류형 가맹 여부", value: "알수없음" },
    ]);

    expect(report).toContain("기준일: 2025-07-31");
    expect(report).toContain("자동 매칭: 1개 시장");
    expect(report).toContain("9행 · 지류형 가맹 여부 · 알수없음");
  });
});
