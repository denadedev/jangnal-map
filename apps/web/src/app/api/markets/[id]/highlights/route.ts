import { loadCatalog } from "../../../../../lib/catalog/load";

export const dynamic = "force-dynamic";

// 지도 패널이 시장을 열 때 읽는 승인된 방문자 제보. 승인하면 바로 보이도록 캐시하지 않는다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const catalog = await loadCatalog();
    const { id } = await params;
    if (!catalog.findMarketById(id)) return Response.json({ message: "시장을 찾지 못했습니다." }, { status: 404 });
    return Response.json({ highlights: catalog.findMarketHighlights(id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Market highlights unavailable", error);
    return Response.json({ message: "제보를 불러오지 못했습니다." }, { status: 503 });
  }
}
