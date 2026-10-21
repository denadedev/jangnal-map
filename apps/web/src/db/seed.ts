// 기존 JSON을 빈 DB에 처음 한 번 넣는다. 검사를 하나라도 어기면 아무것도 넣지 않는다.
import { count } from "drizzle-orm";

import { publicMarkets } from "../lib/market-catalog";
import { marketEditorialEntries } from "../lib/market-editorial";
import type { Db } from "./client";
import * as schema from "./schema";
import { buildSeedRows } from "./seed-rows";

const CHUNK = 500;

export type SeedResult = { status: "seeded"; counts: Record<string, number> } | { status: "skipped"; markets: number };

/** markets가 비어 있을 때만 넣는다. 이미 데이터가 있으면 건너뛴다. */
export async function seedIfEmpty(db: Db): Promise<SeedResult> {
  const { rows, errors } = buildSeedRows(publicMarkets, marketEditorialEntries);
  if (errors.length > 0) throw new Error(`Seed validation failed (${errors.length}):\n${errors.join("\n")}`);

  const [{ value }] = await db.select({ value: count() }).from(schema.markets);
  if (value > 0) return { status: "skipped", markets: value };

  await db.transaction(async (tx) => {
    const insert = async <T extends Parameters<typeof tx.insert>[0]>(table: T, values: T["$inferInsert"][]) => {
      for (let i = 0; i < values.length; i += CHUNK) await tx.insert(table).values(values.slice(i, i + CHUNK));
    };
    await insert(schema.sources, rows.sources);
    await insert(schema.marketDistricts, rows.marketDistricts);
    await insert(schema.markets, rows.markets);
    await insert(schema.marketSchedules, rows.marketSchedules);
    await insert(schema.marketScheduleDays, rows.marketScheduleDays);
    await insert(schema.marketOnnuriMerchantStats, rows.marketOnnuriMerchantStats);
    await insert(schema.marketGuides, rows.marketGuides);
    await insert(schema.marketGuideTips, rows.marketGuideTips);
    await insert(schema.marketGuideSources, rows.marketGuideSources);
    await insert(schema.marketHighlights, rows.marketHighlights);
    await insert(schema.marketNearby, rows.marketNearby);
  });

  return { status: "seeded", counts: Object.fromEntries(Object.entries(rows).map(([key, list]) => [key, list.length])) };
}
