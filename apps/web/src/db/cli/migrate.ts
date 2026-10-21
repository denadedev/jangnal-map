// 배포 때 K3s Job이 실행하는 마이그레이션. 이미지 빌드에서 apps/web/migrate.mjs 한 파일로 묶이고,
// 그 옆의 drizzle/ 폴더를 적용한다. 이미 적용한 파일은 건너뛰므로 매 배포 다시 돌려도 된다.
// 로컬에서는 같은 일을 pnpm db:migrate(drizzle-kit)로 한다.
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb } from "../client";

const { db, pool } = createDb();
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("drizzle", import.meta.url)) });
  console.log("Migrations applied.");
} finally {
  await pool.end();
}
