import { randomUUID } from "node:crypto";

import type { PublicMarket } from "../lib/market";
import { validateMarketEditorial, type MarketEditorialContent } from "../lib/market-editorial";
import { createMarketSlug } from "../lib/market-path";
import { getMarketDistrict, getMarketRegion } from "../lib/region";
import { marketStatusCode, marketTypeCode } from "./codes";
import { editorialHighlightCategories } from "./editorial-highlight-categories";
import type * as schema from "./schema";

type Row<T extends { $inferInsert: unknown }> = T["$inferInsert"] & { id: string };

export interface SeedRows {
  sources: Row<typeof schema.sources>[];
  marketDistricts: Row<typeof schema.marketDistricts>[];
  markets: Row<typeof schema.markets>[];
  marketSchedules: Row<typeof schema.marketSchedules>[];
  marketScheduleDays: Row<typeof schema.marketScheduleDays>[];
  marketOnnuriMerchantStats: Row<typeof schema.marketOnnuriMerchantStats>[];
  marketGuides: Row<typeof schema.marketGuides>[];
  marketGuideTips: Row<typeof schema.marketGuideTips>[];
  marketGuideSources: Row<typeof schema.marketGuideSources>[];
  marketHighlights: Row<typeof schema.marketHighlights>[];
  marketNearby: Row<typeof schema.marketNearby>[];
}

// 세종은 시·군·구가 없어 주소 두 번째 단어가 읍·면이다. 시 하나로 묶는다.
const SEJONG_DISTRICT = "세종특별자치시";

/**
 * 기존 JSON을 DB 행으로 바꾼다. 제약으로 못 거는 규칙도 여기서 검사하고,
 * 하나라도 어기면 errors에 담는다. errors가 비어 있을 때만 넣어야 한다.
 */
export function buildSeedRows(
  publicMarkets: readonly PublicMarket[],
  editorial: readonly MarketEditorialContent[],
): { rows: SeedRows; errors: string[] } {
  const errors = validateMarketEditorial(editorial, publicMarkets);
  const rows: SeedRows = {
    sources: [], marketDistricts: [], markets: [], marketSchedules: [], marketScheduleDays: [],
    marketOnnuriMerchantStats: [], marketGuides: [], marketGuideTips: [], marketGuideSources: [],
    marketHighlights: [], marketNearby: [],
  };

  // 같은 URL이 이름 여러 개로 쓰인 출처는 하나로 합친다. 시장 데이터에 쓰인 이름(지금 시장 상세에 보이는 이름)이 우선이고,
  // 검수 가이드에만 나오는 URL은 그 가운데 가장 긴 이름을 쓴다.
  const sourceNames = new Map<string, string>();
  const marketSourceUrls = new Set<string>();
  const noteSource = ({ name, url }: { name: string; url: string }, fromMarket = false) => {
    if (marketSourceUrls.has(url)) return;
    const current = sourceNames.get(url);
    if (fromMarket || !current || name.length > current.length) sourceNames.set(url, name);
    if (fromMarket) marketSourceUrls.add(url);
  };
  for (const market of publicMarkets) {
    noteSource(market.source, true);
    if (market.scheduleSource) noteSource(market.scheduleSource, true);
    if (market.onnuri) noteSource(market.onnuri.source, true);
  }
  for (const entry of editorial) entry.sources.forEach((entrySource) => noteSource(entrySource));
  const sourceIds = new Map<string, string>();
  for (const [url, name] of sourceNames) {
    const id = randomUUID();
    sourceIds.set(url, id);
    rows.sources.push({ id, name, url });
  }

  const districtIds = new Map<string, string>();
  const marketIds = new Map<string, string>();
  for (const market of publicMarkets) {
    const region = getMarketRegion(market);
    if (!region) {
      errors.push(`unknown region: ${market.id}`);
      continue;
    }
    const districtName = region.slug === "sejong" ? SEJONG_DISTRICT : getMarketDistrict(market);
    if (!districtName) errors.push(`missing district: ${market.id}`);
    const districtKey = `${region.slug}|${districtName}`;
    let districtId = districtIds.get(districtKey);
    if (!districtId) {
      districtId = randomUUID();
      districtIds.set(districtKey, districtId);
      rows.marketDistricts.push({ id: districtId, regionCode: region.slug, name: districtName });
    }

    const marketType = marketTypeCode(market.marketType);
    if (!marketType) errors.push(`unknown marketType: ${market.id} ${market.marketType}`);
    const status = marketStatusCode(market.status);
    if (!status) errors.push(`unknown status: ${market.id} ${market.status}`);

    const id = randomUUID();
    marketIds.set(market.id, id);
    rows.markets.push({
      id,
      legacyId: market.id,
      slug: createMarketSlug(market),
      name: market.name,
      marketType: marketType ?? market.marketType,
      districtId,
      roadAddress: market.roadAddress,
      lotAddress: market.lotAddress,
      latitude: market.latitude,
      longitude: market.longitude,
      phone: market.phone,
      hasParking: market.hasParking,
      status: status ?? market.status,
      statusVerified: market.statusVerified,
      sourceId: sourceIds.get(market.source.url)!,
      referenceDate: market.referenceDate,
    });

    const scheduleId = randomUUID();
    const { schedule } = market;
    rows.marketSchedules.push({
      id: scheduleId,
      marketId: id,
      raw: market.scheduleRaw,
      kind: schedule.kind,
      skipsFirstAfter31st: schedule.kind === "digit-pair" && schedule.skipsFirstAfterThirtyFirst === true,
      sourceId: market.scheduleSource ? sourceIds.get(market.scheduleSource.url)! : null,
      checkedAt: market.scheduleSource?.checkedAt ?? null,
    });
    if (schedule.kind === "digit-pair") {
      if (new Set(schedule.days).size !== 2) errors.push(`digit-pair needs two distinct days: ${market.id}`);
      for (const dayDigit of schedule.days) {
        rows.marketScheduleDays.push({ id: randomUUID(), scheduleId, dayDigit });
      }
    }

    if (market.onnuri) {
      rows.marketOnnuriMerchantStats.push({
        id: randomUUID(),
        marketId: id,
        totalCount: market.onnuri.totalCount,
        digitalCount: market.onnuri.digitalCount,
        paperCount: market.onnuri.paperCount,
        referenceDate: market.onnuri.referenceDate,
        sourceId: sourceIds.get(market.onnuri.source.url)!,
      });
    }
  }

  for (const entry of editorial) {
    const marketId = marketIds.get(entry.marketId);
    if (!marketId) continue; // validateMarketEditorial already reported it
    const guideId = randomUUID();
    rows.marketGuides.push({
      id: guideId,
      marketId,
      summary: entry.summary,
      transportation: entry.transportation,
      parking: entry.parking,
      status: entry.status,
      reviewedAt: entry.reviewedAt,
    });
    entry.visitTips.forEach((body, position) => rows.marketGuideTips.push({ id: randomUUID(), guideId, position, body }));
    entry.sources.forEach((source, position) => rows.marketGuideSources.push({
      id: randomUUID(), guideId, sourceId: sourceIds.get(source.url)!, checkedAt: source.checkedAt, position,
    }));
    for (const name of entry.specialties) {
      const category = editorialHighlightCategories[entry.marketId]?.[name];
      if (!category) errors.push(`missing highlight category: ${entry.marketId} ${name}`);
      else rows.marketHighlights.push({ id: randomUUID(), marketId, name, category, origin: "editorial" });
    }
    entry.nearbyMarketIds.forEach((nearbyId, position) => {
      const nearbyMarketId = marketIds.get(nearbyId);
      if (nearbyMarketId) rows.marketNearby.push({ id: randomUUID(), marketId, nearbyMarketId, position });
    });
  }

  return { rows, errors };
}
