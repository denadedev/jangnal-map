import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url });
  return { db: drizzle(pool, { schema }), pool };
}

export type Db = ReturnType<typeof createDb>["db"];

// 라우트 번들마다 모듈이 따로 올라와도 풀은 프로세스에 하나만 둔다.
const shared = globalThis as { __jangnalDb?: Db };

/** 앱이 함께 쓰는 연결. 처음 부를 때 만든다. */
export const sharedDb = (): Db => (shared.__jangnalDb ??= createDb().db);
