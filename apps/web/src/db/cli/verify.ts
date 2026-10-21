// 마이그레이션·시드 결과를 확인한다: 행 수가 JSON과 같은지, 스키마 규칙(uuid 단일 PK, comment, 트리거·enum·배열 없음)을 지키는지.
import { sql } from "drizzle-orm";

import { publicMarkets } from "../../lib/market-catalog";
import { marketEditorialEntries } from "../../lib/market-editorial";
import { createDb } from "../client";
import { tableNames } from "../schema";

const expectedCounts: Record<string, number> = {
  markets: publicMarkets.length,
  market_schedules: publicMarkets.length,
  market_schedule_days: publicMarkets.filter((market) => market.schedule.kind === "digit-pair").length * 2,
  market_onnuri_merchant_stats: publicMarkets.filter((market) => market.onnuri).length,
  market_guides: marketEditorialEntries.length,
  market_guide_tips: marketEditorialEntries.reduce((sum, entry) => sum + entry.visitTips.length, 0),
  market_guide_sources: marketEditorialEntries.reduce((sum, entry) => sum + entry.sources.length, 0),
  market_specialties: marketEditorialEntries.reduce((sum, entry) => sum + entry.specialties.length, 0),
  market_nearby: marketEditorialEntries.reduce((sum, entry) => sum + entry.nearbyMarketIds.length, 0),
};

const names = sql.join(tableNames.map((table) => sql`${table}`), sql`, `);

async function main() {
  const { db, pool } = createDb();
  const failures: string[] = [];
  try {
    for (const [table, expected] of Object.entries(expectedCounts)) {
      const { rows } = await db.execute<{ n: number }>(sql`select count(*)::int as n from ${sql.identifier(table)}`);
      if (rows[0].n !== expected) failures.push(`${table}: ${rows[0].n} rows, expected ${expected}`);
    }

    const checks: [string, ReturnType<typeof sql>][] = [
      ["tables", sql`select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name in (${names})`],
      ["primary keys that are not a single uuid id", sql`
        select count(*)::int as n from pg_constraint c
        join pg_class r on r.oid = c.conrelid join pg_namespace ns on ns.oid = r.relnamespace
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
        where ns.nspname = 'public' and c.contype = 'p' and r.relname in (${names})
          and (cardinality(c.conkey) <> 1 or a.attname <> 'id' or a.atttypid <> 'uuid'::regtype)`],
      ["tables without comment", sql`
        select count(*)::int as n from information_schema.tables t
        where t.table_schema = 'public' and t.table_name in (${names})
          and obj_description(format('public.%I', t.table_name)::regclass, 'pg_class') is null`],
      ["columns without comment", sql`
        select count(*)::int as n from information_schema.columns c
        where c.table_schema = 'public' and c.table_name in (${names})
          and col_description(format('public.%I', c.table_name)::regclass, c.ordinal_position) is null`],
      ["array or json columns", sql`
        select count(*)::int as n from information_schema.columns
        where table_schema = 'public' and table_name in (${names}) and data_type in ('ARRAY', 'json', 'jsonb')`],
      ["enum types", sql`select count(*)::int as n from pg_type t join pg_namespace ns on ns.oid = t.typnamespace where ns.nspname = 'public' and t.typtype = 'e'`],
      ["user triggers", sql`
        select count(*)::int as n from pg_trigger g join pg_class r on r.oid = g.tgrelid
        where not g.tgisinternal and r.relname in (${names})`],
    ];
    for (const [label, query] of checks) {
      const { rows } = await db.execute<{ n: number }>(query);
      const expected = label === "tables" ? tableNames.length : 0;
      if (rows[0].n !== expected) failures.push(`${label}: ${rows[0].n}, expected ${expected}`);
    }
  } finally {
    await pool.end();
  }

  if (failures.length > 0) {
    console.error(`DB verification failed:\n${failures.join("\n")}`);
    process.exit(1);
  }
  console.log("DB verification passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
