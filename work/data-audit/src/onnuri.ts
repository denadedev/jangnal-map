import { readFile } from "node:fs/promises";

import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";

import type { CsvEncoding } from "./types.js";

export interface RawOnnuriMerchant {
  가맹점명: string;
  "소속 시장명(또는 상점가)": string;
  소재지: string;
  취급품목: string;
  "지류형 가맹 여부": string;
  "디지털형 가맹 여부": string;
  등록년도: string;
}

export interface NormalizedOnnuriMerchant {
  marketName: string;
  marketKey: string;
  region: string;
  merchantKey: string;
  supportsDigital: boolean;
  supportsPaper: boolean;
}

export interface OnnuriMarketAggregate {
  marketName: string;
  marketKey: string;
  region: string;
  totalCount: number;
  digitalCount: number;
  paperCount: number;
}

export interface OnnuriRowIssue {
  rowNumber: number;
  field: string;
  value: string;
}

export interface OnnuriAggregateResult {
  aggregates: OnnuriMarketAggregate[];
  issues: OnnuriRowIssue[];
}

const requiredColumns = [
  "가맹점명",
  "소속 시장명(또는 상점가)",
  "소재지",
  "지류형 가맹 여부",
  "디지털형 가맹 여부",
] as const;

const normalizeKey = (value: string): string => value
  .normalize("NFKC")
  .replace(/\([^)]*\)/g, "")
  .replace(/\s+/g, "")
  .toLocaleLowerCase("ko-KR");

export const normalizeOnnuriMarketKey = (value: string): string => normalizeKey(value)
  .replace(/전통시장$/, "")
  .replace(/시장$/, "");

export const extractOnnuriRegion = (address: string): string => address
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .join(" ");

const parseMembership = (
  value: string,
  field: "지류형 가맹 여부" | "디지털형 가맹 여부",
  rowNumber: number,
): { value: boolean | null; issue: OnnuriRowIssue | null } => {
  const normalized = value.trim().toUpperCase();
  if (["Y", "O", "1", "예"].includes(normalized)) return { value: true, issue: null };
  if (["N", "X", "0", "아니오", ""].includes(normalized)) return { value: false, issue: null };
  return { value: null, issue: { rowNumber, field, value: value.trim() } };
};

export async function readOnnuriCsv(path: string, encoding: CsvEncoding): Promise<RawOnnuriMerchant[]> {
  const buffer = await readFile(path);
  const text = encoding === "utf8" ? buffer.toString("utf8") : iconv.decode(buffer, "euc-kr");
  const rows = parse(text, { bom: true, columns: true, skip_empty_lines: true, trim: false }) as RawOnnuriMerchant[];
  const first = rows[0] as Record<string, unknown> | undefined;
  const missingColumns = requiredColumns.filter((column) => !first || !(column in first));
  if (missingColumns.length > 0) throw new Error(`CSV 필수 컬럼이 없습니다: ${missingColumns.join(", ")}`);
  return rows;
}

export function normalizeOnnuriMerchant(
  row: RawOnnuriMerchant,
  rowNumber: number,
): { merchant: NormalizedOnnuriMerchant | null; issue: OnnuriRowIssue | null } {
  const paper = parseMembership(row["지류형 가맹 여부"], "지류형 가맹 여부", rowNumber);
  if (paper.issue) return { merchant: null, issue: paper.issue };
  const digital = parseMembership(row["디지털형 가맹 여부"], "디지털형 가맹 여부", rowNumber);
  if (digital.issue) return { merchant: null, issue: digital.issue };

  const marketName = row["소속 시장명(또는 상점가)"].trim();
  const address = row.소재지.trim();
  const merchantName = normalizeKey(row.가맹점명);
  const merchantKey = address
    ? `${merchantName}|${normalizeKey(address)}`
    : `${merchantName}|row-${rowNumber}`;

  return {
    merchant: {
      marketName,
      marketKey: normalizeOnnuriMarketKey(marketName),
      region: extractOnnuriRegion(address),
      merchantKey,
      supportsDigital: digital.value === true,
      supportsPaper: paper.value === true,
    },
    issue: null,
  };
}

export function aggregateOnnuriMerchants(rows: RawOnnuriMerchant[]): OnnuriAggregateResult {
  const issues: OnnuriRowIssue[] = [];
  const markets = new Map<string, {
    marketName: string;
    marketKey: string;
    region: string;
    merchants: Map<string, { digital: boolean; paper: boolean }>;
  }>();

  rows.forEach((row, index) => {
    const normalized = normalizeOnnuriMerchant(row, index + 2);
    if (normalized.issue) {
      issues.push(normalized.issue);
      return;
    }
    const merchant = normalized.merchant!;
    const aggregateKey = `${merchant.region}|${merchant.marketKey}`;
    const market = markets.get(aggregateKey) ?? {
      marketName: merchant.marketName,
      marketKey: merchant.marketKey,
      region: merchant.region,
      merchants: new Map(),
    };
    const existing = market.merchants.get(merchant.merchantKey) ?? { digital: false, paper: false };
    market.merchants.set(merchant.merchantKey, {
      digital: existing.digital || merchant.supportsDigital,
      paper: existing.paper || merchant.supportsPaper,
    });
    markets.set(aggregateKey, market);
  });

  const aggregates = [...markets.values()].map((market) => {
    const merchants = [...market.merchants.values()];
    return {
      marketName: market.marketName,
      marketKey: market.marketKey,
      region: market.region,
      totalCount: merchants.length,
      digitalCount: merchants.filter(({ digital }) => digital).length,
      paperCount: merchants.filter(({ paper }) => paper).length,
    };
  });

  return { aggregates, issues };
}
