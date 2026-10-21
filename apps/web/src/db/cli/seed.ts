// 기존 JSON을 DB에 처음 한 번 넣는다. 검사를 하나라도 어기거나 이미 데이터가 있으면 아무것도 넣지 않는다.
import { count } from "drizzle-orm";

import { publicMarkets } from "../../lib/market-catalog";
import { marketEditorialEntries } from "../../lib/market-editorial";
import { createDb } from "../client";
import * as schema from "../schema";
import { buildSeedRows } from "../seed-rows";

const CHUNK = 500;

async function main() {
  const { rows, errors } = buildSeedRows(publicMarkets, marketEditorialEntries);
  if (errors.length > 0) {
    console.error(`Seed validation failed (${errors.length}):\n${errors.join("\n")}`);
    process.exit(1);
  }

  const { db, pool } = createDb();
  try {
    const [{ value }] = await db.select({ value: count() }).from(schema.markets);
    if (value > 0) throw new Error(`markets already has ${value} rows; seed only runs on an empty database`);

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
      await insert(schema.marketSpecialties, rows.marketSpecialties);
      await insert(schema.marketNearby, rows.marketNearby);
    });

    console.log(JSON.stringify(Object.fromEntries(Object.entries(rows).map(([key, list]) => [key, list.length]))));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
