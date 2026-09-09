import type { PublicMarket } from "./generate-public-markets.js";
import {
  extractOnnuriRegion,
  normalizeOnnuriMarketKey,
  type OnnuriMarketAggregate,
  type OnnuriRowIssue,
} from "./onnuri.js";

const ONNURI_SOURCE_NAME = "소상공인시장진흥공단 전국 온누리상품권 가맹점 현황";
const ONNURI_SOURCE_URL = "https://www.data.go.kr/data/3060079/fileData.do?recommendDataYn=Y";

export interface OnnuriMerchantSummary {
  totalCount: number;
  digitalCount: number;
  paperCount: number;
  referenceDate: string;
  source: { name: string; url: string };
}

export interface OnnuriMatchEntry {
  marketName: string;
  region: string;
}

export interface OnnuriConflict extends OnnuriMatchEntry {
  candidateIds: string[];
}

export interface OnnuriMatchReport {
  referenceDate: string;
  totalAggregates: number;
  autoMatches: number;
  manualMatches: number;
  unmatched: OnnuriMatchEntry[];
  conflicts: OnnuriConflict[];
}

export interface OnnuriMatchResult {
  summariesByMarketId: Map<string, OnnuriMerchantSummary>;
  report: OnnuriMatchReport;
}

const provinceAliases: Record<string, string> = {
  서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천",
  광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산", 세종특별자치시: "세종",
  경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남",
  전라북도: "전북", 전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북",
  경상남도: "경남", 제주도: "제주", 제주특별자치도: "제주",
};

const provinceFrom = (value: string): string => {
  const firstToken = value.trim().split(/\s+/)[0] ?? "";
  return provinceAliases[firstToken] ?? firstToken;
};

const marketProvince = (market: PublicMarket): string => provinceFrom(extractOnnuriRegion(
  market.roadAddress ?? market.lotAddress ?? "",
));

const overrideKey = (aggregate: OnnuriMarketAggregate): string => `${aggregate.region}|${aggregate.marketKey}`;

const summaryFrom = (aggregate: OnnuriMarketAggregate, referenceDate: string): OnnuriMerchantSummary => ({
  totalCount: aggregate.totalCount,
  digitalCount: aggregate.digitalCount,
  paperCount: aggregate.paperCount,
  referenceDate,
  source: { name: ONNURI_SOURCE_NAME, url: ONNURI_SOURCE_URL },
});

export function matchOnnuriMarkets(
  markets: PublicMarket[],
  aggregates: OnnuriMarketAggregate[],
  overrides: Record<string, string>,
  referenceDate: string,
): OnnuriMatchResult {
  const marketIds = new Set(markets.map(({ id }) => id));
  for (const id of Object.values(overrides)) {
    if (!marketIds.has(id)) throw new Error(`수동 매핑 대상 시장이 없습니다: ${id}`);
  }

  const byName = new Map<string, PublicMarket[]>();
  for (const market of markets) {
    const key = normalizeOnnuriMarketKey(market.name);
    byName.set(key, [...(byName.get(key) ?? []), market]);
  }

  const summariesByMarketId = new Map<string, OnnuriMerchantSummary>();
  const unmatched: OnnuriMatchEntry[] = [];
  const conflicts: OnnuriConflict[] = [];
  let autoMatches = 0;
  let manualMatches = 0;

  for (const aggregate of aggregates) {
    const manualId = overrides[overrideKey(aggregate)];
    if (manualId) {
      summariesByMarketId.set(manualId, summaryFrom(aggregate, referenceDate));
      manualMatches += 1;
      continue;
    }

    const nameCandidates = byName.get(aggregate.marketKey) ?? [];
    const regionCandidates = nameCandidates.filter((candidate) => (
      aggregate.region.length > 0 && marketProvince(candidate) === provinceFrom(aggregate.region)
    ));

    if (regionCandidates.length === 1) {
      summariesByMarketId.set(regionCandidates[0]!.id, summaryFrom(aggregate, referenceDate));
      autoMatches += 1;
    } else if (nameCandidates.length > 0) {
      conflicts.push({
        marketName: aggregate.marketName,
        region: aggregate.region,
        candidateIds: nameCandidates.map(({ id }) => id).sort(),
      });
    } else {
      unmatched.push({ marketName: aggregate.marketName, region: aggregate.region });
    }
  }

  return {
    summariesByMarketId,
    report: {
      referenceDate,
      totalAggregates: aggregates.length,
      autoMatches,
      manualMatches,
      unmatched: unmatched.sort((a, b) => a.marketName.localeCompare(b.marketName, "ko-KR")),
      conflicts: conflicts.sort((a, b) => a.marketName.localeCompare(b.marketName, "ko-KR")),
    },
  };
}

export function renderOnnuriMatchReport(report: OnnuriMatchReport, issues: OnnuriRowIssue[]): string {
  const unmatched = report.unmatched.length > 0
    ? report.unmatched.map(({ marketName, region }) => `- ${region} · ${marketName}`).join("\n")
    : "- 없음";
  const conflicts = report.conflicts.length > 0
    ? report.conflicts.map(({ marketName, region, candidateIds }) => `- ${region} · ${marketName} → ${candidateIds.join(", ")}`).join("\n")
    : "- 없음";
  const issueLines = issues.length > 0
    ? issues.map(({ rowNumber, field, value }) => `- ${rowNumber}행 · ${field} · ${value}`).join("\n")
    : "- 없음";

  return `# 온누리상품권 매칭 결과

- 기준일: ${report.referenceDate}
- 원본 시장·상점가 집계: ${report.totalAggregates}개
- 자동 매칭: ${report.autoMatches}개 시장
- 수동 매칭: ${report.manualMatches}개 시장
- 미매칭: ${report.unmatched.length}개
- 충돌: ${report.conflicts.length}개

## 충돌

${conflicts}

## 미매칭

${unmatched}

## 제외된 원본 행

${issueLines}
`;
}
