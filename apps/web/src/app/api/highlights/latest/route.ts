import { loadCatalog } from "../../../../lib/catalog/load";

export const dynamic = "force-dynamic";

// 메인 지도의 "새 이야기"가 읽는 가장 최근 승인 제보 한 건. 승인하면 바로 보이도록 캐시하지 않는다.
export async function GET(): Promise<Response> {
  try {
    const catalog = await loadCatalog();
    return Response.json({ highlight: catalog.latestHighlight() ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Latest highlight unavailable", error);
    return Response.json({ message: "제보를 불러오지 못했습니다." }, { status: 503 });
  }
}
