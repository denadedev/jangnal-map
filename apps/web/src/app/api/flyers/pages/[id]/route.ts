import { sharedDb } from "../../../../../db/client";
import { findFlyerPageImage } from "../../../../../db/flyers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 페이지 id는 바뀌지 않지만, 내리거나 숨긴 전단이 하루 안에 사라지도록 immutable 대신 하루만 캐시한다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  try {
    const page = await findFlyerPageImage(sharedDb(), id);
    if (!page) return new Response("not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response(new Uint8Array(page.image), {
      headers: { "Content-Type": page.contentType, "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" },
    });
  } catch (error) {
    console.error("Flyer page image unavailable", error);
    return new Response("unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
