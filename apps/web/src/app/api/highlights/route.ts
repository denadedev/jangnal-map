import { loadCatalog } from "../../../lib/catalog/load";

export const dynamic = "force-dynamic";

// 메인 지도가 읽는 승인된 방문자 제보 전부(최근 승인 순). 마커·목록 표시와 목록 위 이야기 카드에 쓴다.
// 승인하면 바로 보이도록 캐시하지 않는다.
export async function GET(): Promise<Response> {
  try {
    const catalog = await loadCatalog();
    return Response.json({ highlights: catalog.recentHighlights() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Highlights unavailable", error);
    return Response.json({ message: "제보를 불러오지 못했습니다." }, { status: 503 });
  }
}
