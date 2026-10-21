// 기존 JSON을 DB에 처음 한 번 넣는다. 검사를 하나라도 어기거나 이미 데이터가 있으면 아무것도 넣지 않는다.
import { createDb } from "../client";
import { seedIfEmpty } from "../seed";

async function main() {
  const { db, pool } = createDb();
  try {
    const result = await seedIfEmpty(db);
    if (result.status === "skipped") {
      throw new Error(`markets already has ${result.markets} rows; seed only runs on an empty database`);
    }
    console.log(JSON.stringify(result.counts));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
