import { gzipSync } from "node:zlib";

import { loadCatalog } from "../../../lib/catalog/load";
import type { PublicMarket } from "../../../lib/market";

export const dynamic = "force-dynamic";

// Next는 라우트 핸들러 응답을 압축하지 않아 목록이 1.1MB 그대로 나갔다. 스냅샷마다 한 번만 만들어 둔다.
const encoded = new WeakMap<PublicMarket[], { json: string; gzip: Uint8Array<ArrayBuffer> }>();

const encode = (markets: PublicMarket[]) => {
  let entry = encoded.get(markets);
  if (!entry) {
    const json = JSON.stringify(markets);
    entry = { json, gzip: new Uint8Array(gzipSync(json)) };
    encoded.set(markets, entry);
  }
  return entry;
};

// 지도가 읽는 전체 시장 목록. 모양은 예전 /data/markets.json과 같다.
export async function GET(request: Request): Promise<Response> {
  try {
    const { markets } = await loadCatalog();
    const { json, gzip } = encode(markets);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // 지도 탭으로 돌아올 때마다 다시 받지 않도록 브라우저도 10분 동안 쓴다.
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
      Vary: "Accept-Encoding",
    };
    if (/\bgzip\b/.test(request.headers.get("Accept-Encoding") ?? "")) {
      return new Response(gzip, { headers: { ...headers, "Content-Encoding": "gzip" } });
    }
    return new Response(json, { headers });
  } catch (error) {
    console.error("Market list unavailable", error);
    return Response.json({ message: "시장 데이터를 불러오지 못했습니다." }, { status: 503 });
  }
}
