import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { isPublishableMarket } from "./analyze.js";
import { normalizeMarket } from "./normalize-market.js";
import { parseSchedule } from "./parse-schedule.js";
import { readMarketsCsv } from "./read-csv.js";
import type { NormalizedMarket, RawMarket } from "./types.js";

const SOURCE_NAME = "공공데이터포털 전국전통시장표준데이터";
const SOURCE_URL = "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y";

export interface PublicMarket {
  name: string;
  marketType: string;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number;
  longitude: number;
  scheduleRaw: string;
  schedule: { kind: "digit-pair"; days: [number, number] };
  phone: string | null;
  hasParking: boolean | null;
  referenceDate: string | null;
  status: "운영" | "폐장";
  statusVerified: boolean;
  source: {
    name: string;
    url: string;
    referenceDate: string | null;
  };
}

const publicMarket = (raw: RawMarket, market: NormalizedMarket): PublicMarket | null => {
  if (!isPublishableMarket(market)) return null;

  const schedule = parseSchedule(market.scheduleRaw);
  if (schedule.kind !== "digit-pair" || market.latitude === null || market.longitude === null) return null;

  const referenceDate = market.referenceDate ?? (raw.데이터기준일자.trim() || null);
  return {
    name: market.name,
    marketType: market.marketType,
    roadAddress: market.roadAddress,
    lotAddress: market.lotAddress,
    latitude: market.latitude,
    longitude: market.longitude,
    scheduleRaw: market.scheduleRaw!,
    schedule: { kind: "digit-pair", days: [schedule.days[0], schedule.days[1] === 10 ? 0 : schedule.days[1]] },
    phone: market.phone,
    hasParking: market.hasParking,
    referenceDate,
    status: market.status,
    statusVerified: market.statusVerified,
    source: { name: SOURCE_NAME, url: SOURCE_URL, referenceDate },
  };
};

export function generatePublicMarkets(rawRows: RawMarket[], normalizedRows: NormalizedMarket[]): PublicMarket[] {
  return normalizedRows.flatMap((market, index) => {
    const raw = rawRows[index];
    return raw ? (publicMarket(raw, market) ?? []) : [];
  });
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
  const markets = generatePublicMarkets(rawRows, rawRows.map(normalizeMarket));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(markets, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ rows: markets.length, output }));
}
