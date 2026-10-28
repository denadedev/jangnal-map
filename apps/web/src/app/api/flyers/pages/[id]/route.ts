import { sharedDb } from "../../../../../db/client";
import { findFlyerPageImage } from "../../../../../db/flyers";
import { getFlyerImage } from "../../../../../lib/flyer-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () => new Response("not found", { status: 404, headers: { "Cache-Control": "no-store" } });

// 이미지는 저장소에 있고, 게시 중인지는 DB로 본다. 그래서 버킷을 공개하지 않고 여기서 넘겨준다.
// 페이지 id는 바뀌지 않지만, 내리거나 숨긴 전단이 하루 안에 사라지도록 immutable 대신 하루만 캐시한다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  try {
    const page = await findFlyerPageImage(sharedDb(), id);
    if (!page) return notFound();
    const image = await getFlyerImage(page.storageKey);
    if (!image) return notFound();
    return new Response(new Uint8Array(image), {
      headers: { "Content-Type": page.contentType, "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" },
    });
  } catch (error) {
    console.error("Flyer page image unavailable", error);
    return new Response("unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
