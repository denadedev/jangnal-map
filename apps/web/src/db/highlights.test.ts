// 실제 PostgreSQL이 있을 때만 돈다 (DATABASE_URL에 마이그레이션·시드가 끝난 DB). 만든 행은 끝나고 지운다.
import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { createDb } from "./client";
import { decideSubmission, findMarketRowId, hasDuplicateHighlight, insertSubmission } from "./highlights";
import * as schema from "./schema";
import { readDbSnapshot } from "./snapshot";

describe.skipIf(!process.env.DATABASE_URL)("highlight submissions on PostgreSQL", () => {
  const { db, pool } = process.env.DATABASE_URL ? createDb() : ({} as ReturnType<typeof createDb>);
  const created: string[] = [];
  const legacyId = "market-989da9eee01d8dda"; // 중앙신시장, 검수 품목 "안동 간고등어"가 있다

  afterAll(async () => {
    if (!pool) return;
    const rows = await db.select({ highlightId: schema.marketHighlightSubmissions.highlightId }).from(schema.marketHighlightSubmissions)
      .where(inArray(schema.marketHighlightSubmissions.id, created));
    await db.delete(schema.marketHighlightSubmissions).where(inArray(schema.marketHighlightSubmissions.id, created));
    const highlightIds = rows.map((row) => row.highlightId).filter((id): id is string => Boolean(id));
    if (highlightIds.length) await db.delete(schema.marketHighlights).where(inArray(schema.marketHighlights.id, highlightIds));
    await pool.end();
  });

  it("approves once, links the new highlight, and shows it in the snapshot", async () => {
    const marketId = (await findMarketRowId(db, legacyId))!;
    expect(marketId).toBeDefined();
    const id = await insertSubmission(db, marketId, { name: "안동 식혜 테스트", description: "생강이 들어가요", category: "food" });
    created.push(id);

    expect(await hasDuplicateHighlight(db, marketId, "안동식혜테스트")).toBe(true);
    expect(await decideSubmission(db, id, { approve: true, category: "specialty" }, "U_TEST")).toEqual({ status: "approved", category: "specialty" });
    expect(await decideSubmission(db, id, { approve: false }, "U_TEST")).toEqual({ status: "already-decided", current: "approved" });

    const [row] = await db.select().from(schema.marketHighlightSubmissions).where(eq(schema.marketHighlightSubmissions.id, id));
    expect(row).toMatchObject({ status: "approved", category: "specialty", decidedBy: "U_TEST" });
    expect(row.highlightId).not.toBeNull();

    const snapshot = await readDbSnapshot(db);
    expect(snapshot.highlights).toContainEqual({ marketId: legacyId, name: "안동 식혜 테스트", description: "생강이 들어가요", category: "specialty" });
    expect(snapshot.editorial.find((entry) => entry.marketId === legacyId)?.specialties).not.toContain("안동 식혜 테스트");
  });

  it("reports a name that already exists as a duplicate and leaves the submission pending", async () => {
    const marketId = (await findMarketRowId(db, legacyId))!;
    expect(await hasDuplicateHighlight(db, marketId, "안동간고등어")).toBe(true);
    const id = await insertSubmission(db, marketId, { name: "안동 간고등어", description: null, category: "specialty" });
    created.push(id);

    expect(await decideSubmission(db, id, { approve: true, category: "specialty" }, "U_TEST")).toEqual({ status: "duplicate" });
    const [row] = await db.select().from(schema.marketHighlightSubmissions).where(eq(schema.marketHighlightSubmissions.id, id));
    expect(row.status).toBe("pending");
  });

  it("rejects without creating a highlight", async () => {
    const marketId = (await findMarketRowId(db, legacyId))!;
    const id = await insertSubmission(db, marketId, { name: "반려 테스트", description: null, category: "tip" });
    created.push(id);
    expect(await decideSubmission(db, id, { approve: false }, "U_TEST")).toEqual({ status: "rejected" });
    const [row] = await db.select().from(schema.marketHighlightSubmissions).where(eq(schema.marketHighlightSubmissions.id, id));
    expect(row).toMatchObject({ status: "rejected", highlightId: null });
    expect(await decideSubmission(db, "not-a-uuid", { approve: false }, "U_TEST")).toEqual({ status: "missing" });
  });
});
