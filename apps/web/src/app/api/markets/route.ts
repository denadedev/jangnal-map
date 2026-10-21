import { loadCatalog } from "../../../lib/catalog/load";

export const dynamic = "force-dynamic";

// 지도가 읽는 전체 시장 목록. 모양은 예전 /data/markets.json과 같다.
export async function GET(): Promise<Response> {
  try {
    const { markets } = await loadCatalog();
    return Response.json(markets, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Market list unavailable", error);
    return Response.json({ message: "시장 데이터를 불러오지 못했습니다." }, { status: 503 });
  }
}
