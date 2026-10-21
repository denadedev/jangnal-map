import { catalogSource, loadCatalog } from "../../../lib/catalog/load";

export const dynamic = "force-dynamic";

// readiness probe. 시장 데이터 스냅샷을 읽을 수 있어야 트래픽을 받는다.
export async function GET(): Promise<Response> {
  try {
    const { markets } = await loadCatalog();
    return Response.json({ status: "ok", source: catalogSource(), markets: markets.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json({ status: "unavailable", source: catalogSource() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
