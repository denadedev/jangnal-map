import { timingSafeEqual } from "node:crypto";

import { refreshCatalog } from "./load";

const matches = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/** 운영용. DB를 고친 뒤 `Authorization: Bearer <REVALIDATE_TOKEN>`으로 부르면 스냅샷을 바로 다시 읽는다. */
export function createRevalidateHandler(refresh: typeof refreshCatalog = refreshCatalog) {
  return async function POST(request: Request): Promise<Response> {
    const token = process.env.REVALIDATE_TOKEN?.trim();
    if (!token) return Response.json({ message: "revalidate is not configured" }, { status: 404 });
    const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!matches(given, token)) return Response.json({ message: "unauthorized" }, { status: 401 });

    try {
      const { markets } = await refresh();
      return Response.json({ status: "ok", markets: markets.length });
    } catch (error) {
      console.error("Catalog revalidate failed; keeping the previous snapshot", error);
      return Response.json({ message: "refresh failed" }, { status: 503 });
    }
  };
}
