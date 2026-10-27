// 대형마트 주간 전단 읽기·쓰기. 날짜 인자는 한국 날짜 "YYYY-MM-DD".
import { and, asc, desc, eq, gte, inArray, lt, lte } from "drizzle-orm";

import type { FlyerPageImage } from "../lib/flyer-image";
import { flyerDeleteBefore, type FlyerUploadInput } from "../lib/flyers";
import type { Db } from "./client";
import type { MartBrandCode } from "./codes";
import * as schema from "./schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CurrentFlyer {
  id: string;
  startsOn: string;
  endsOn: string;
  baseStoreName: string | null;
  pages: { id: string; width: number; height: number }[];
}

export interface BrandFlyers {
  code: MartBrandCode;
  name: string;
  officialFlyerUrl: string;
  /** 숨김 브랜드이거나 오늘 걸린 전단이 없으면 null. */
  flyer: CurrentFlyer | null;
}

/** 브랜드 순서대로, 오늘 보여 줄 게시 중 전단(기간이 겹치면 나중에 올린 것)과 페이지 목록. */
export async function listBrandFlyers(db: Db, today: string): Promise<BrandFlyers[]> {
  const brands = await db.select().from(schema.martBrands).orderBy(asc(schema.martBrands.position));
  const visibleIds = brands.filter((brand) => !brand.hidden).map((brand) => brand.id);
  const flyers = visibleIds.length === 0 ? [] : await db.select().from(schema.martFlyers).where(and(
    inArray(schema.martFlyers.brandId, visibleIds),
    eq(schema.martFlyers.status, "published"),
    lte(schema.martFlyers.startsOn, today),
    gte(schema.martFlyers.endsOn, today),
  )).orderBy(desc(schema.martFlyers.createdAt));
  const latest = new Map<string, (typeof flyers)[number]>();
  for (const flyer of flyers) if (!latest.has(flyer.brandId)) latest.set(flyer.brandId, flyer);

  const flyerIds = [...latest.values()].map((flyer) => flyer.id);
  const pages = flyerIds.length === 0 ? [] : await db.select({
    id: schema.martFlyerPages.id,
    flyerId: schema.martFlyerPages.flyerId,
    width: schema.martFlyerPages.width,
    height: schema.martFlyerPages.height,
  }).from(schema.martFlyerPages).where(inArray(schema.martFlyerPages.flyerId, flyerIds)).orderBy(asc(schema.martFlyerPages.position));

  return brands.map((brand) => {
    const flyer = latest.get(brand.id);
    return {
      code: brand.code as MartBrandCode,
      name: brand.name,
      officialFlyerUrl: brand.officialFlyerUrl,
      flyer: flyer ? {
        id: flyer.id,
        startsOn: flyer.startsOn,
        endsOn: flyer.endsOn,
        baseStoreName: flyer.baseStoreName,
        pages: pages.filter((page) => page.flyerId === flyer.id).map(({ id, width, height }) => ({ id, width, height })),
      } : null,
    };
  });
}

/** 게시 중이고 브랜드가 숨김이 아닌 전단의 페이지 이미지. 아니면 undefined. */
export async function findFlyerPageImage(db: Db, pageId: string): Promise<{ image: Buffer; contentType: string } | undefined> {
  if (!uuidPattern.test(pageId)) return undefined;
  const [row] = await db.select({ image: schema.martFlyerPages.image, contentType: schema.martFlyerPages.contentType })
    .from(schema.martFlyerPages)
    .innerJoin(schema.martFlyers, eq(schema.martFlyers.id, schema.martFlyerPages.flyerId))
    .innerJoin(schema.martBrands, eq(schema.martBrands.id, schema.martFlyers.brandId))
    .where(and(eq(schema.martFlyerPages.id, pageId), eq(schema.martFlyers.status, "published"), eq(schema.martBrands.hidden, false)));
  return row;
}

export type PublishResult = { status: "published"; flyerId: string; replaced: number; deleted: number } | { status: "missing-brand" };

/**
 * 전단을 게시한다. 같은 브랜드에 기간이 겹치는 게시 중 전단은 내리고(다시 올리면 교체),
 * 종료일이 30일 넘게 지난 전단은 페이지와 함께 지운다. 정리 전용 예약 작업은 두지 않는다.
 */
export async function publishFlyer(db: Db, input: FlyerUploadInput, pages: FlyerPageImage[], uploadedBy: string, today: string): Promise<PublishResult> {
  if (pages.length === 0) throw new Error("A flyer needs at least one page");
  return db.transaction(async (tx) => {
    const [brand] = await tx.select({ id: schema.martBrands.id }).from(schema.martBrands).where(eq(schema.martBrands.code, input.brand));
    if (!brand) return { status: "missing-brand" } as const;

    const replaced = await tx.update(schema.martFlyers).set({ status: "removed" }).where(and(
      eq(schema.martFlyers.brandId, brand.id),
      eq(schema.martFlyers.status, "published"),
      lte(schema.martFlyers.startsOn, input.endsOn),
      gte(schema.martFlyers.endsOn, input.startsOn),
    )).returning({ id: schema.martFlyers.id });

    const [flyer] = await tx.insert(schema.martFlyers).values({
      brandId: brand.id,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
      baseStoreName: input.baseStoreName,
      status: "published",
      uploadedBySlackUser: uploadedBy,
    }).returning({ id: schema.martFlyers.id });
    await tx.insert(schema.martFlyerPages).values(pages.map((page, position) => ({ flyerId: flyer.id, position, ...page })));

    const deleted = await tx.delete(schema.martFlyers).where(lt(schema.martFlyers.endsOn, flyerDeleteBefore(today))).returning({ id: schema.martFlyers.id });
    return { status: "published", flyerId: flyer.id, replaced: replaced.length, deleted: deleted.length } as const;
  });
}

export async function setFlyerMessageTs(db: Db, flyerId: string, ts: string): Promise<void> {
  await db.update(schema.martFlyers).set({ slackMessageTs: ts }).where(eq(schema.martFlyers.id, flyerId));
}

export type FlyerRemovalResult = { status: "removed" } | { status: "already-removed" } | { status: "missing" };

export async function removeFlyer(db: Db, flyerId: string): Promise<FlyerRemovalResult> {
  if (!uuidPattern.test(flyerId)) return { status: "missing" };
  const [row] = await db.select({ status: schema.martFlyers.status }).from(schema.martFlyers).where(eq(schema.martFlyers.id, flyerId));
  if (!row) return { status: "missing" };
  if (row.status === "removed") return { status: "already-removed" };
  await db.update(schema.martFlyers).set({ status: "removed" }).where(eq(schema.martFlyers.id, flyerId));
  return { status: "removed" };
}

/** 브랜드 숨김을 켜고 끈다. 브랜드가 없으면 false. */
export async function setBrandHidden(db: Db, code: MartBrandCode, hidden: boolean): Promise<boolean> {
  const rows = await db.update(schema.martBrands).set({ hidden }).where(eq(schema.martBrands.code, code)).returning({ id: schema.martBrands.id });
  return rows.length > 0;
}
