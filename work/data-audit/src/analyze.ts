import { parseSchedule } from "./parse-schedule.js";
import type { NormalizedMarket } from "./types.js";

export interface AuditResult {
  totalRows: number;
  dailyMarkets: number;
  periodicCandidates: number;
  validCoordinates: number;
  parseableSchedules: number;
  publishableRows: number;
  fieldCompleteness: {
    address: number;
    phone: number;
    parking: number;
    homepage: number;
    referenceDate: number;
  };
  marketTypeCounts: Array<{ value: string; count: number }>;
  scheduleCounts: Array<{ value: string; count: number }>;
  unknownScheduleCounts: Array<{ raw: string; count: number }>;
  duplicateCandidates: Array<{ key: string; names: string[] }>;
  invalidCoordinateMarkets: Array<{ name: string; latitude: number | null; longitude: number | null }>;
  regionCounts: Array<{ region: string; candidates: number; publishable: number }>;
}

const countValues = (values: string[]): Array<{ value: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "ko"));
};

const hasValidCoordinates = (market: NormalizedMarket): boolean =>
  market.latitude !== null &&
  market.longitude !== null &&
  market.latitude >= 33 &&
  market.latitude <= 39.5 &&
  market.longitude >= 124 &&
  market.longitude <= 132;

const isPeriodicCandidate = (market: NormalizedMarket): boolean => {
  if (/\d일장/.test(market.marketType)) return true;
  if (!market.scheduleRaw) return false;
  return parseSchedule(market.scheduleRaw).kind !== "daily";
};

const compact = (value: string): string => value.replaceAll(/\s/g, "");

export function analyzeMarkets(markets: NormalizedMarket[]): AuditResult {
  const candidates = markets.filter(isPeriodicCandidate);
  const parsedCandidates = candidates.map((market) => ({ market, schedule: parseSchedule(market.scheduleRaw) }));
  const publishable = parsedCandidates.filter(
    ({ market, schedule }) => schedule.kind === "digit-pair" && hasValidCoordinates(market),
  );

  const duplicateGroups = new Map<string, string[]>();
  for (const market of markets) {
    const address = market.roadAddress ?? market.lotAddress ?? "";
    if (!address) continue;

    const key = `${compact(market.name)}|${compact(address)}`;
    duplicateGroups.set(key, [...(duplicateGroups.get(key) ?? []), market.name]);
  }

  const unknownScheduleCounts = countValues(
    parsedCandidates.flatMap(({ schedule }) => (schedule.kind === "unknown" ? [schedule.raw] : [])),
  ).map(({ value, count }) => ({ raw: value, count }));

  const regions = new Map<string, { candidates: number; publishable: number }>();
  for (const { market, schedule } of parsedCandidates) {
    const region = (market.roadAddress ?? market.lotAddress ?? "주소없음").split(/\s+/)[0] || "주소없음";
    const current = regions.get(region) ?? { candidates: 0, publishable: 0 };
    current.candidates += 1;
    if (schedule.kind === "digit-pair" && hasValidCoordinates(market)) current.publishable += 1;
    regions.set(region, current);
  }

  return {
    totalRows: markets.length,
    dailyMarkets: markets.filter((market) => parseSchedule(market.scheduleRaw).kind === "daily").length,
    periodicCandidates: candidates.length,
    validCoordinates: candidates.filter(hasValidCoordinates).length,
    parseableSchedules: parsedCandidates.filter(({ schedule }) => schedule.kind === "digit-pair").length,
    publishableRows: publishable.length,
    fieldCompleteness: {
      address: markets.filter((market) => market.roadAddress !== null || market.lotAddress !== null).length,
      phone: markets.filter((market) => market.phone !== null).length,
      parking: markets.filter((market) => market.hasParking !== null).length,
      homepage: markets.filter((market) => market.homepageUrl !== null).length,
      referenceDate: markets.filter((market) => market.referenceDate !== null).length,
    },
    marketTypeCounts: countValues(markets.map((market) => market.marketType)),
    scheduleCounts: countValues(markets.map((market) => market.scheduleRaw ?? "")),
    unknownScheduleCounts,
    duplicateCandidates: [...duplicateGroups.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([key, names]) => ({ key, names }))
      .sort((a, b) => a.key.localeCompare(b.key, "ko")),
    invalidCoordinateMarkets: candidates
      .filter((market) => !hasValidCoordinates(market))
      .map(({ name, latitude, longitude }) => ({ name, latitude, longitude })),
    regionCounts: [...regions.entries()]
      .map(([region, counts]) => ({ region, ...counts }))
      .sort((a, b) => b.candidates - a.candidates || a.region.localeCompare(b.region, "ko")),
  };
}
