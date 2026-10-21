// DB에서 읽은 시장 데이터가 지금 JSON과 같은지 확인한다. 화면이 실제로 쓰는 경로(readDbSnapshot)를 그대로 탄다.
import { loadJsonSnapshot } from "../../lib/catalog/json-source";
import { createDb } from "../client";
import { snapshotDifferences } from "../parity";
import { readDbSnapshot } from "../snapshot";

async function main() {
  const { db, pool } = createDb();
  try {
    const fromDb = await readDbSnapshot(db);
    const differences = snapshotDifferences(fromDb, loadJsonSnapshot());
    if (differences.length > 0) {
      console.error(`DB snapshot differs from JSON (${differences.length}):\n${differences.slice(0, 50).join("\n")}`);
      process.exit(1);
    }
    console.log(`DB snapshot matches JSON: ${fromDb.markets.length} markets, ${fromDb.editorial.length} guides`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
