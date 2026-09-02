import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { isPublishableMarket, type AuditResult } from "./analyze.js";
import { parseSchedule } from "./parse-schedule.js";
import type { NormalizedMarket } from "./types.js";

export type AuditVerdict = "사용 가능" | "보완 후 사용 가능" | "사용 불가";

const SOURCE_NAME = "공공데이터포털 전국전통시장표준데이터";
const SOURCE_URL = "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y";

const percent = (value: number, total: number): string =>
  total === 0 ? "0.0%" : `${((value / total) * 100).toFixed(1)}%`;

export const determineVerdict = (result: AuditResult): AuditVerdict => {
  const ratio = result.periodicCandidates === 0 ? 0 : result.publishableRows / result.periodicCandidates;
  if (ratio >= 0.9) return "사용 가능";
  if (ratio >= 0.7) return "보완 후 사용 가능";
  return "사용 불가";
};

const markdownRows = (rows: string[]): string => (rows.length > 0 ? rows.join("\n") : "- 없음");

const selectRegionalSample = (markets: NormalizedMarket[], limit: number): NormalizedMarket[] => {
  const groups = new Map<string, NormalizedMarket[]>();
  for (const market of markets.filter(isPublishableMarket)) {
    const region = (market.roadAddress ?? market.lotAddress ?? "주소없음").split(/\s+/)[0] || "주소없음";
    groups.set(region, [...(groups.get(region) ?? []), market]);
  }

  const sample: NormalizedMarket[] = [];
  while (sample.length < limit && [...groups.values()].some((group) => group.length > 0)) {
    for (const group of groups.values()) {
      const market = group.shift();
      if (market) sample.push(market);
      if (sample.length === limit) break;
    }
  }
  return sample;
};

const buildReport = (result: AuditResult): string => {
  const verdict = determineVerdict(result);
  const completeness = result.fieldCompleteness;

  return `# 전국전통시장 데이터 조사 결과

- 조사일: 2026-09-02
- 원천: [${SOURCE_NAME}](${SOURCE_URL})
- 원본 레코드: ${result.totalRows}

## 결론

**${verdict}**

공개 가능 비율은 장날 후보 ${result.periodicCandidates}개 중 ${result.publishableRows}개, ${percent(result.publishableRows, result.periodicCandidates)}다. 좌표와 장날 규칙이 모두 검증된 개별 시장만 지도 공개 대상으로 삼는다.

## 전체 현황

- 전체 시장: ${result.totalRows}
- 매일 운영 표기: ${result.dailyMarkets}
- 장날 후보: ${result.periodicCandidates}
- 바로 게시 가능한 시장: ${result.publishableRows}/${result.periodicCandidates} (${percent(result.publishableRows, result.periodicCandidates)})

## 데이터 품질

- 전체 시장의 유효 좌표: ${result.allValidCoordinates}/${result.totalRows} (${percent(result.allValidCoordinates, result.totalRows)})
- 장날 후보의 유효 좌표: ${result.validCoordinates}/${result.periodicCandidates} (${percent(result.validCoordinates, result.periodicCandidates)})
- 장날 파싱 가능률: ${result.parseableSchedules}/${result.periodicCandidates} (${percent(result.parseableSchedules, result.periodicCandidates)})
- 중복 후보 그룹: ${result.duplicateCandidates.length}
- 주소 채움률: ${completeness.address}/${result.totalRows} (${percent(completeness.address, result.totalRows)})
- 전화번호 채움률: ${completeness.phone}/${result.totalRows} (${percent(completeness.phone, result.totalRows)})
- 주차정보 채움률: ${completeness.parking}/${result.totalRows} (${percent(completeness.parking, result.totalRows)})
- 홈페이지 채움률: ${completeness.homepage}/${result.totalRows} (${percent(completeness.homepage, result.totalRows)})
- 데이터 기준일 채움률: ${completeness.referenceDate}/${result.totalRows} (${percent(completeness.referenceDate, result.totalRows)})

## 운영 상태 한계

- 원본에는 운영·폐장 상태 필드가 없다.
- 정규화 샘플의 상태는 데이터 모델 제약에 따라 운영으로 두되 statusVerified: false로 표시한다.
- 최초 적재 또는 공개 전에 별도 출처로 폐장 여부를 확인해야 한다.

## 시장 유형 분포

${markdownRows(result.marketTypeCounts.map(({ value, count }) => `- ${value || "(빈 값)"}: ${count}`))}

## 장날 원문 분포

${markdownRows(result.scheduleCounts.map(({ value, count }) => `- ${value || "(빈 값)"}: ${count}`))}

## 파싱 불가능한 장날 원문

${markdownRows(result.unknownScheduleCounts.map(({ raw, count }) => `- ${raw || "(빈 값)"}: ${count}`))}

### 수동 확인 대상 시장

${markdownRows(result.unknownScheduleMarkets.map(({ name, raw }) => `- ${name}: ${raw || "(빈 값)"}`))}

## 좌표 보완 대상

${markdownRows(
  result.invalidCoordinateMarkets.map(
    ({ name, latitude, longitude }) => `- ${name}: 위도 ${latitude ?? "없음"}, 경도 ${longitude ?? "없음"}`,
  ),
)}

## 중복 후보

${markdownRows(result.duplicateCandidates.map(({ key, names }) => `- ${key}: ${names.join(", ")}`))}

## 권역별 장날 후보

| 권역 | 후보 | 게시 가능 |
|---|---:|---:|
${result.regionCounts.map(({ region, candidates, publishable }) => `| ${region} | ${candidates} | ${publishable} |`).join("\n")}

## 수동 보완 예상량

- 장날 또는 좌표 보완 대상: ${result.periodicCandidates - result.publishableRows}
- 장날 원문 확인 대상: ${result.unknownScheduleCounts.reduce((sum, item) => sum + item.count, 0)}
- 전체 좌표 확인 대상: ${result.invalidCoordinateMarkets.length}
- 장날 후보 좌표 확인 대상: ${result.invalidCandidateCoordinateMarkets.length}
- 중복 확인 그룹: ${result.duplicateCandidates.length}

## 서비스 진행 판정

- 판정: **${verdict}**
- 사용 가능은 바로 게시 가능한 비율이 90% 이상임을 뜻한다.
- 불완전한 개별 행은 전체 비율과 관계없이 자동 게시하지 않는다.
- 실제 출처 대조 수동 검산을 통과한 뒤 최초 데이터베이스 적재로 진행한다.
`;
};

export async function writeAuditOutputs(
  markets: NormalizedMarket[],
  result: AuditResult,
  reportPath: string,
  samplePath: string,
): Promise<void> {
  const sample = selectRegionalSample(markets, 100).map((market) => ({
    name: market.name,
    marketType: market.marketType,
    roadAddress: market.roadAddress,
    lotAddress: market.lotAddress,
    latitude: market.latitude,
    longitude: market.longitude,
    scheduleRaw: market.scheduleRaw,
    schedule: parseSchedule(market.scheduleRaw),
    phone: market.phone,
    hasParking: market.hasParking,
    referenceDate: market.referenceDate,
    status: market.status,
    statusVerified: market.statusVerified,
    source: {
      name: SOURCE_NAME,
      url: SOURCE_URL,
      referenceDate: market.referenceDate,
    },
  }));

  await mkdir(dirname(reportPath), { recursive: true });
  await mkdir(dirname(samplePath), { recursive: true });
  await writeFile(reportPath, buildReport(result), "utf8");
  await writeFile(samplePath, `${JSON.stringify(sample, null, 2)}\n`, "utf8");
}
