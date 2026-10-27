// 실제 PostgreSQL이 있을 때만 돈다 (DATABASE_URL에 마이그레이션이 끝난 DB). 만든 전단은 끝나고 지우고, 브랜드 숨김은 되돌린다.
import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import type { FlyerPageImage } from "../lib/flyer-image";
import type { FlyerUploadInput } from "../lib/flyers";
import { createDb } from "./client";
import { findFlyerPageImage, listBrandFlyers, publishFlyer, removeFlyer, setBrandHidden } from "./flyers";
import * as schema from "./schema";

const page = (byte: number): FlyerPageImage => ({ image: Buffer.from([byte, 1, 2]), contentType: "image/webp", width: 10, height: 16, byteSize: 3 });

describe.skipIf(!process.env.DATABASE_URL)("mart flyers on PostgreSQL", () => {
  const { db, pool } = process.env.DATABASE_URL ? createDb() : ({} as ReturnType<typeof createDb>);
  const created: string[] = [];
  const week: FlyerUploadInput = { brand: "homeplus", startsOn: "2026-10-29", endsOn: "2026-11-04", baseStoreName: "금천점" };

  afterAll(async () => {
    if (!pool) return;
    if (created.length) await db.delete(schema.martFlyers).where(inArray(schema.martFlyers.id, created));
    await setBrandHidden(db, "homeplus", false);
    await pool.end();
  });

  const publish = async (input: FlyerUploadInput, pages: FlyerPageImage[], today = "2026-10-29") => {
    const result = await publishFlyer(db, input, pages, "U_TEST", today);
    if (result.status === "published") created.push(result.flyerId);
    return result;
  };

  it("shows the newest published flyer with pages in order, and replaces an overlapping one", async () => {
    const first = await publish(week, [page(1)]);
    const second = await publish(week, [page(2), page(3)]);
    expect(second).toMatchObject({ status: "published", replaced: 1 });

    const homeplus = (await listBrandFlyers(db, "2026-10-30")).find((brand) => brand.code === "homeplus")!;
    expect(homeplus.flyer).toMatchObject({ id: second.status === "published" ? second.flyerId : "", baseStoreName: "금천점", startsOn: "2026-10-29", endsOn: "2026-11-04" });
    expect(homeplus.flyer!.pages).toHaveLength(2);
    expect((await findFlyerPageImage(db, homeplus.flyer!.pages[0].id))?.image[0]).toBe(2);

    const [old] = await db.select().from(schema.martFlyers).where(eq(schema.martFlyers.id, first.status === "published" ? first.flyerId : ""));
    expect(old.status).toBe("removed");
    expect((await listBrandFlyers(db, "2026-11-05")).find((brand) => brand.code === "homeplus")!.flyer).toBeNull();
  });

  it("hides every page while the brand is hidden and after removal", async () => {
    const result = await publish({ ...week, brand: "homeplus", startsOn: "2026-11-05", endsOn: "2026-11-11" }, [page(4)]);
    if (result.status !== "published") throw new Error("not published");
    const pageId = (await listBrandFlyers(db, "2026-11-06")).find((brand) => brand.code === "homeplus")!.flyer!.pages[0].id;

    expect(await setBrandHidden(db, "homeplus", true)).toBe(true);
    expect(await findFlyerPageImage(db, pageId)).toBeUndefined();
    expect((await listBrandFlyers(db, "2026-11-06")).find((brand) => brand.code === "homeplus")).toMatchObject({ flyer: null, officialFlyerUrl: "https://my.homeplus.co.kr/leaflet" });
    await setBrandHidden(db, "homeplus", false);

    expect(await removeFlyer(db, result.flyerId)).toEqual({ status: "removed" });
    expect(await removeFlyer(db, result.flyerId)).toEqual({ status: "already-removed" });
    expect(await findFlyerPageImage(db, pageId)).toBeUndefined();
    expect(await removeFlyer(db, "not-a-uuid")).toEqual({ status: "missing" });
  });

  it("deletes flyers that ended more than 30 days before the upload day", async () => {
    const old = await publish({ ...week, brand: "emart", startsOn: "2026-09-01", endsOn: "2026-09-07" }, [page(5)], "2026-09-01");
    const fresh = await publish({ ...week, brand: "emart", startsOn: "2026-10-08", endsOn: "2026-10-14" }, [page(6)], "2026-10-08");
    expect(fresh).toMatchObject({ deleted: 1 });
    const rows = await db.select({ id: schema.martFlyers.id }).from(schema.martFlyers).where(eq(schema.martFlyers.id, old.status === "published" ? old.flyerId : ""));
    expect(rows).toEqual([]);
    const pages = await db.select({ id: schema.martFlyerPages.id }).from(schema.martFlyerPages).where(eq(schema.martFlyerPages.flyerId, old.status === "published" ? old.flyerId : ""));
    expect(pages).toEqual([]);
  });
});
