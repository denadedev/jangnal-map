import { readFile, rename, writeFile } from "node:fs/promises";

import { attachOnnuriSummaries, type PublicMarket } from "./generate-public-markets.js";
import { matchOnnuriMarkets, renderOnnuriMatchReport } from "./onnuri-match.js";
import { aggregateOnnuriMerchants, readOnnuriCsv } from "./onnuri.js";
import type { CsvEncoding } from "./types.js";

const valueAfter = (flag: string): string => {
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${flag} 인자가 필요합니다`);
  return value;
};

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, "utf8")) as T;

const writeAtomically = async (path: string, content: string): Promise<void> => {
  const temporaryPath = `${path}.tmp-${process.pid}`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, path);
};

export async function enrichPublicMarkets(options: {
  marketsPath: string;
  onnuriPath: string;
  onnuriEncoding: CsvEncoding;
  referenceDate: string;
  overridesPath: string;
  outputPath: string;
  reportPath: string;
}): Promise<{ markets: PublicMarket[]; report: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.referenceDate)) {
    throw new Error("--onnuri-reference-date는 YYYY-MM-DD 형식이어야 합니다");
  }
  const [markets, rows, overrides] = await Promise.all([
    readJson<PublicMarket[]>(options.marketsPath),
    readOnnuriCsv(options.onnuriPath, options.onnuriEncoding),
    readJson<Record<string, string>>(options.overridesPath),
  ]);
  const { aggregates, issues } = aggregateOnnuriMerchants(rows);
  const matched = matchOnnuriMarkets(markets, aggregates, overrides, options.referenceDate);
  return {
    markets: attachOnnuriSummaries(markets, matched.summariesByMarketId),
    report: renderOnnuriMatchReport(matched.report, issues),
  };
}

if (process.argv[1]?.endsWith("enrich-public-markets.ts")) {
  const encoding = valueAfter("--onnuri-encoding");
  if (encoding !== "utf8" && encoding !== "euc-kr") {
    throw new Error("--onnuri-encoding은 utf8 또는 euc-kr이어야 합니다");
  }
  const outputPath = valueAfter("--output");
  const reportPath = valueAfter("--report");
  const result = await enrichPublicMarkets({
    marketsPath: valueAfter("--markets"),
    onnuriPath: valueAfter("--onnuri"),
    onnuriEncoding: encoding,
    referenceDate: valueAfter("--onnuri-reference-date"),
    overridesPath: valueAfter("--overrides"),
    outputPath,
    reportPath,
  });
  await writeAtomically(outputPath, `${JSON.stringify(result.markets, null, 2)}\n`);
  await writeAtomically(reportPath, result.report);
  console.log(JSON.stringify({ markets: result.markets.length, output: outputPath, report: reportPath }));
}
