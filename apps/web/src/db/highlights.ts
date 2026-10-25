// 방문자 제보와 승인. 화면에 보이는 항목은 market_highlights, 대기열은 market_highlight_submissions.
import { and, eq, sql, type AnyColumn } from "drizzle-orm";

import type { HighlightSubmissionInput } from "../lib/highlight-submission";
import type { Db } from "./client";
import type { HighlightCategoryCode } from "./codes";
import * as schema from "./schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sameName = (column: AnyColumn, key: string) =>
  sql`regexp_replace(${column}, '\\s', '', 'g') = ${key}`;

/** 화면이 쓰는 시장 id(옛 JSON id, 없으면 uuid)를 DB id로 바꾼다. */
export async function findMarketRowId(db: Db, clientId: string): Promise<string | undefined> {
  const [row] = await db.select({ id: schema.markets.id }).from(schema.markets).where(
    uuidPattern.test(clientId) ? eq(schema.markets.id, clientId) : eq(schema.markets.legacyId, clientId),
  );
  return row?.id;
}

/** 같은 시장에 공백을 뺀 이름이 같은 검토 중 제보나 공개 항목이 있는지. */
export async function hasDuplicateHighlight(db: Db, marketId: string, nameKey: string): Promise<boolean> {
  const [pending] = await db.select({ id: schema.marketHighlightSubmissions.id }).from(schema.marketHighlightSubmissions).where(and(
    eq(schema.marketHighlightSubmissions.marketId, marketId),
    eq(schema.marketHighlightSubmissions.status, "pending"),
    sameName(schema.marketHighlightSubmissions.name, nameKey),
  )).limit(1);
  if (pending) return true;
  const [existing] = await db.select({ id: schema.marketHighlights.id }).from(schema.marketHighlights).where(and(
    eq(schema.marketHighlights.marketId, marketId),
    sameName(schema.marketHighlights.name, nameKey),
  )).limit(1);
  return Boolean(existing);
}

export async function insertSubmission(db: Db, marketId: string, input: HighlightSubmissionInput): Promise<string> {
  const [row] = await db.insert(schema.marketHighlightSubmissions)
    .values({ marketId, name: input.name, description: input.description, category: input.category })
    .returning({ id: schema.marketHighlightSubmissions.id });
  return row.id;
}

export type DecisionResult =
  | { status: "approved"; category: HighlightCategoryCode }
  | { status: "rejected" }
  | { status: "duplicate" }
  | { status: "already-decided"; current: string }
  | { status: "missing" };

const isUniqueViolation = (error: unknown): boolean => {
  for (let cause = error; cause && typeof cause === "object"; cause = (cause as { cause?: unknown }).cause) {
    if ((cause as { code?: unknown }).code === "23505") return true;
  }
  return false;
};

/**
 * 검토 중인 제보만 승인·반려한다. 승인이면 같은 트랜잭션에서 origin=user 항목을 만들고 제보와 잇는다.
 * 같은 버튼이 두 번 와도 두 번째는 already-decided가 된다.
 */
export async function decideSubmission(
  db: Db,
  submissionId: string,
  decision: { approve: true; category: HighlightCategoryCode } | { approve: false },
  decidedBy: string,
): Promise<DecisionResult> {
  if (!uuidPattern.test(submissionId)) return { status: "missing" };
  try {
    return await db.transaction(async (tx) => {
      const [submission] = await tx.select().from(schema.marketHighlightSubmissions)
        .where(eq(schema.marketHighlightSubmissions.id, submissionId)).for("update");
      if (!submission) return { status: "missing" } as const;
      if (submission.status !== "pending") return { status: "already-decided", current: submission.status } as const;

      const decided = { decidedAt: new Date(), decidedBy };
      if (!decision.approve) {
        await tx.update(schema.marketHighlightSubmissions).set({ ...decided, status: "rejected" })
          .where(eq(schema.marketHighlightSubmissions.id, submissionId));
        return { status: "rejected" } as const;
      }
      const [highlight] = await tx.insert(schema.marketHighlights).values({
        marketId: submission.marketId,
        name: submission.name,
        description: submission.description,
        category: decision.category,
        origin: "user",
      }).returning({ id: schema.marketHighlights.id });
      await tx.update(schema.marketHighlightSubmissions)
        .set({ ...decided, status: "approved", category: decision.category, highlightId: highlight.id })
        .where(eq(schema.marketHighlightSubmissions.id, submissionId));
      return { status: "approved", category: decision.category } as const;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { status: "duplicate" };
    throw error;
  }
}

export type RemovalResult = { status: "removed" } | { status: "already-removed" } | { status: "not-approved"; current: string } | { status: "missing" };

/**
 * 승인된 제보의 공개 항목(origin=user)을 지운다. 제보 행은 approved로 두고, FK가 highlight_id를 null로 바꾼다.
 * highlight_id가 이미 null이면 지워진 것으로 본다.
 */
export async function removeApprovedHighlight(db: Db, submissionId: string): Promise<RemovalResult> {
  if (!uuidPattern.test(submissionId)) return { status: "missing" };
  return db.transaction(async (tx) => {
    const [submission] = await tx.select().from(schema.marketHighlightSubmissions)
      .where(eq(schema.marketHighlightSubmissions.id, submissionId)).for("update");
    if (!submission) return { status: "missing" } as const;
    if (submission.status !== "approved") return { status: "not-approved", current: submission.status } as const;
    if (!submission.highlightId) return { status: "already-removed" } as const;
    await tx.delete(schema.marketHighlights)
      .where(and(eq(schema.marketHighlights.id, submission.highlightId), eq(schema.marketHighlights.origin, "user")));
    return { status: "removed" } as const;
  });
}
