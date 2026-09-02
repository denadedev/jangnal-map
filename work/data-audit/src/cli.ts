import { analyzeMarkets } from "./analyze.js";
import { normalizeMarket } from "./normalize-market.js";
import { readMarketsCsv } from "./read-csv.js";
import { determineVerdict, writeAuditOutputs, type AuditVerdict } from "./report.js";
import type { CsvEncoding } from "./types.js";

export interface AuditOptions {
  input: string;
  encoding: CsvEncoding;
  report: string;
  sample: string;
}

export interface AuditSummary {
  rows: number;
  candidates: number;
  publishable: number;
  verdict: AuditVerdict;
}

export async function runAudit(options: AuditOptions): Promise<AuditSummary> {
  const raw = await readMarketsCsv(options.input, options.encoding);
  const markets = raw.map(normalizeMarket);
  const result = analyzeMarkets(markets);

  await writeAuditOutputs(markets, result, options.report, options.sample);

  return {
    rows: result.totalRows,
    candidates: result.periodicCandidates,
    publishable: result.publishableRows,
    verdict: determineVerdict(result),
  };
}

const valueAfter = (flag: string): string => {
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${flag} 인자가 필요합니다`);
  return value;
};

if (process.argv[1]?.endsWith("cli.ts")) {
  const encoding = valueAfter("--encoding");
  if (encoding !== "utf8" && encoding !== "euc-kr") {
    throw new Error("--encoding은 utf8 또는 euc-kr이어야 합니다");
  }

  const summary = await runAudit({
    input: valueAfter("--input"),
    encoding,
    report: valueAfter("--report"),
    sample: valueAfter("--sample"),
  });
  console.log(JSON.stringify(summary));
}
