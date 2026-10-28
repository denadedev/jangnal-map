import { currentFlyersKey, loadBrandFlyers } from "../../../../lib/this-week";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 하단 탭 "이번 주"의 새 전단 점. 지금 걸린 전단 묶음을 가리키는 값만 준다. 새로 올라오면 값이 바뀐다.
export async function GET(): Promise<Response> {
  const key = currentFlyersKey(await loadBrandFlyers(new Date()));
  return Response.json({ key }, { headers: { "Cache-Control": "public, max-age=300" } });
}
