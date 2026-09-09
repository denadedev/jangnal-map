import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

import { hasValidCoordinates } from "./analyze.js";
import { normalizeMarket } from "./normalize-market.js";
import { parseSchedule } from "./parse-schedule.js";
import { readMarketsCsv } from "./read-csv.js";
import type { NormalizedMarket, RawMarket } from "./types.js";
import type { OnnuriMerchantSummary } from "./onnuri-match.js";

const SOURCE_NAME = "공공데이터포털 전국전통시장표준데이터";
const SOURCE_URL = "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y";

export interface PublicMarket {
  id: string;
  name: string;
  marketType: string;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduleRaw: string;
  schedule:
    | { kind: "daily" }
    | { kind: "digit-pair"; days: [number, number] }
    | { kind: "unknown"; raw: string };
  phone: string | null;
  hasParking: boolean | null;
  referenceDate: string | null;
  status: "운영" | "폐장";
  statusVerified: boolean;
  onnuri: OnnuriMerchantSummary | null;
  source: {
    name: string;
    url: string;
    referenceDate: string | null;
  };
}

const publicSchedule = (raw: string | null): PublicMarket["schedule"] => {
  const schedule = parseSchedule(raw);
  if (schedule.kind === "daily") return { kind: "daily" };
  if (schedule.kind === "digit-pair") {
    return { kind: "digit-pair", days: [schedule.days[0], schedule.days[1] === 10 ? 0 : schedule.days[1]] };
  }
  return { kind: "unknown", raw: schedule.raw };
};

const publicMarket = (raw: RawMarket, market: NormalizedMarket): PublicMarket => {
  const validCoordinates = hasValidCoordinates(market);

  const referenceDate = market.referenceDate ?? (raw.데이터기준일자.trim() || null);
  const identity = [market.name, market.roadAddress ?? "", market.lotAddress ?? "", market.latitude, market.longitude, market.scheduleRaw].join("|");
  const id = `market-${createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 16)}`;
  return {
    id,
    name: market.name,
    marketType: market.marketType,
    roadAddress: market.roadAddress,
    lotAddress: market.lotAddress,
    latitude: validCoordinates ? market.latitude : null,
    longitude: validCoordinates ? market.longitude : null,
    scheduleRaw: market.scheduleRaw ?? "",
    schedule: publicSchedule(market.scheduleRaw),
    phone: market.phone,
    hasParking: market.hasParking,
    referenceDate,
    status: market.status,
    statusVerified: market.statusVerified,
    onnuri: null,
    source: { name: SOURCE_NAME, url: SOURCE_URL, referenceDate },
  };
};

export function generatePublicMarkets(rawRows: RawMarket[]): PublicMarket[] {
  return rawRows.map((raw) => publicMarket(raw, normalizeMarket(raw)));
}

export function attachOnnuriSummaries(
  markets: PublicMarket[],
  summariesByMarketId: Map<string, OnnuriMerchantSummary>,
): PublicMarket[] {
  return markets.map((market) => ({
    ...market,
    onnuri: summariesByMarketId.get(market.id) ?? null,
  }));
}

const valueAfter = (flag: string): string => {
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${flag} 인자가 필요합니다`);
  return value;
};

if (process.argv[1]?.endsWith("generate-public-markets.ts")) {
  const input = valueAfter("--input");
  const output = valueAfter("--output");
  const encoding = valueAfter("--encoding");
  if (encoding !== "utf8" && encoding !== "euc-kr") throw new Error("--encoding은 utf8 또는 euc-kr이어야 합니다");

  const rawRows = await readMarketsCsv(input, encoding);
  const markets = generatePublicMarkets(rawRows);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(markets, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ rows: markets.length, output }));
}
