// 배포 때 K3s Job이 실행하는 마이그레이션. 이미지 빌드에서 apps/web/migrate.mjs 한 파일로 묶이고,
// 그 옆의 drizzle/ 폴더를 적용한다. 이미 적용한 파일은 건너뛰므로 매 배포 다시 돌려도 된다.
// 마이그레이션 뒤 DB가 비어 있으면 JSON 시드도 넣는다 (이미 데이터가 있으면 건너뜀).
// 로컬에서는 같은 일을 pnpm db:migrate(drizzle-kit), pnpm db:seed로 한다.
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb } from "../client";
import { seedIfEmpty } from "../seed";

const { db, pool } = createDb();
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("drizzle", import.meta.url)) });
  console.log("Migrations applied.");
  const seed = await seedIfEmpty(db);
  console.log(seed.status === "seeded" ? `Seeded ${JSON.stringify(seed.counts)}` : `Seed skipped: markets has ${seed.markets} rows.`);
} finally {
  await pool.end();
}
