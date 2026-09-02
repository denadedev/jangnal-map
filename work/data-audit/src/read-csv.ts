import { readFile } from "node:fs/promises";

import { parse } from "csv-parse/sync";
import iconv from "iconv-lite";

import type { CsvEncoding, RawMarket } from "./types.js";

const requiredColumns = ["시장명", "시장유형", "시장개설주기", "위도", "경도"] as const;

export async function readMarketsCsv(path: string, encoding: CsvEncoding): Promise<RawMarket[]> {
  const buffer = await readFile(path);
  const text = encoding === "utf8" ? buffer.toString("utf8") : iconv.decode(buffer, "euc-kr");
  const rows = parse(text, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: false,
  }) as RawMarket[];

  const first = rows[0] as Record<string, unknown> | undefined;
  const missingColumns = requiredColumns.filter((column) => !first || !(column in first));
  if (missingColumns.length > 0) {
    throw new Error(`CSV 필수 컬럼이 없습니다: ${missingColumns.join(", ")}`);
  }

  return rows;
}

