import { sortMarkets, type CatalogSnapshot } from "../lib/catalog/catalog";
import type { MarketSchedule, PublicMarket } from "../lib/market";
import type { MarketEditorialContent } from "../lib/market-editorial";
import type { Db } from "./client";
import {
  HIGHLIGHT_CATEGORY_LABELS,
  MARKET_STATUS_LABELS,
  MARKET_TYPE_LABELS,
  type HighlightCategoryCode,
  type MarketStatusCode,
  type MarketTypeCode,
} from "./codes";
import * as schema from "./schema";
import type { SeedRows } from "./seed-rows";

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;
const categoryOrder = Object.keys(HIGHLIGHT_CATEGORY_LABELS) as HighlightCategoryCode[];
type HighlightRow = SeedRows["marketHighlights"][number];
// 카테고리 순, 그 안에서는 등록 순, 같은 때 넣은 행은 이름 순.
const byHighlightOrder = (a: HighlightRow, b: HighlightRow) =>
  categoryOrder.indexOf(a.category as HighlightCategoryCode) - categoryOrder.indexOf(b.category as HighlightCategoryCode)
  || (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)
  || a.name.localeCompare(b.name, "ko");
// 5·10일장은 0을 10으로 보고 작은 끝자리부터 둔다 (기존 JSON과 같은 순서).
const dayOrder = (day: number): number => (day === 0 ? 10 : day);

function groupBy<T>(rows: readonly T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) groups.set(key(row), [...(groups.get(key(row)) ?? []), row]);
  return groups;
}

/** DB 행을 화면이 쓰는 기존 JSON 모양으로 되돌린다. 코드값은 여기서 화면 이름으로 바꾼다. */
export function assembleSnapshot(rows: SeedRows): CatalogSnapshot {
  const sources = new Map(rows.sources.map((source) => [source.id, { name: source.name, url: source.url }]));
  const source = (id: string) => sources.get(id)!;
  const clientIds = new Map(rows.markets.map((market) => [market.id, market.legacyId ?? market.id]));
  const schedules = new Map(rows.marketSchedules.map((schedule) => [schedule.marketId, schedule]));
  const scheduleDays = groupBy(rows.marketScheduleDays, (day) => day.scheduleId);
  const onnuri = new Map(rows.marketOnnuriMerchantStats.map((stats) => [stats.marketId, stats]));

  const markets = rows.markets.map((row): PublicMarket => {
    const schedule = schedules.get(row.id)!;
    const days = (scheduleDays.get(schedule.id) ?? []).map((day) => day.dayDigit).sort((a, b) => dayOrder(a) - dayOrder(b));
    const marketSchedule: MarketSchedule = schedule.kind === "digit-pair"
      ? { kind: "digit-pair", days: days as [number, number], ...(schedule.skipsFirstAfter31st ? { skipsFirstAfterThirtyFirst: true as const } : {}) }
      : schedule.kind === "daily" ? { kind: "daily" } : { kind: "unknown", raw: schedule.raw ?? "" };
    const stats = onnuri.get(row.id);
    const referenceDate = row.referenceDate ?? null;

    return {
      id: clientIds.get(row.id)!,
      name: row.name,
      marketType: MARKET_TYPE_LABELS[row.marketType as MarketTypeCode] ?? row.marketType,
      roadAddress: row.roadAddress ?? null,
      lotAddress: row.lotAddress ?? null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      scheduleRaw: schedule.raw ?? "",
      schedule: marketSchedule,
      phone: row.phone ?? null,
      hasParking: row.hasParking ?? null,
      referenceDate,
      status: MARKET_STATUS_LABELS[row.status as MarketStatusCode] ?? "운영",
      statusVerified: row.statusVerified ?? false,
      source: { ...source(row.sourceId), referenceDate },
      onnuri: stats
        ? {
          totalCount: stats.totalCount,
          digitalCount: stats.digitalCount,
          paperCount: stats.paperCount,
          referenceDate: stats.referenceDate,
          source: source(stats.sourceId),
        }
        : null,
      ...(schedule.sourceId && schedule.checkedAt
        ? { scheduleSource: { ...source(schedule.sourceId), checkedAt: schedule.checkedAt } }
        : {}),
    };
  });

  const tips = groupBy(rows.marketGuideTips, (tip) => tip.guideId);
  const guideSources = groupBy(rows.marketGuideSources, (entry) => entry.guideId);
  // 사용자 제보(origin=user)는 검수 가이드와 따로 보여 줄 예정이라 여기에 넣지 않는다.
  const specialties = groupBy(rows.marketHighlights.filter((highlight) => highlight.origin === "editorial"), (highlight) => highlight.marketId);
  const nearby = groupBy(rows.marketNearby, (entry) => entry.marketId);
  const editorial = rows.marketGuides.map((guide): MarketEditorialContent => ({
    marketId: clientIds.get(guide.marketId)!,
    summary: guide.summary,
    visitTips: (tips.get(guide.id) ?? []).sort(byPosition).map((tip) => tip.body),
    transportation: guide.transportation,
    parking: guide.parking,
    specialties: (specialties.get(guide.marketId) ?? []).sort(byHighlightOrder).map((highlight) => highlight.name),
    nearbyMarketIds: (nearby.get(guide.marketId) ?? []).sort(byPosition).map((entry) => clientIds.get(entry.nearbyMarketId)!),
    sources: (guideSources.get(guide.id) ?? []).sort(byPosition).map((entry) => ({ ...source(entry.sourceId), checkedAt: entry.checkedAt })),
    reviewedAt: guide.reviewedAt,
    status: "reviewed",
  }));

  return { markets: sortMarkets(markets), editorial };
}

/** 공개된 가이드만 화면에 쓴다. 테이블마다 한 번씩, 모두 같은 읽기 트랜잭션에서 읽는다. */
export async function readDbSnapshot(db: Db): Promise<CatalogSnapshot> {
  const rows = await db.transaction(async (tx) => ({
    sources: await tx.select().from(schema.sources),
    marketDistricts: [],
    markets: await tx.select().from(schema.markets),
    marketSchedules: await tx.select().from(schema.marketSchedules),
    marketScheduleDays: await tx.select().from(schema.marketScheduleDays),
    marketOnnuriMerchantStats: await tx.select().from(schema.marketOnnuriMerchantStats),
    marketGuides: (await tx.select().from(schema.marketGuides)).filter((guide) => guide.status === "reviewed"),
    marketGuideTips: await tx.select().from(schema.marketGuideTips),
    marketGuideSources: await tx.select().from(schema.marketGuideSources),
    marketHighlights: await tx.select().from(schema.marketHighlights),
    marketNearby: await tx.select().from(schema.marketNearby),
  }), { isolationLevel: "repeatable read", accessMode: "read only" });
  return assembleSnapshot(rows);
}
