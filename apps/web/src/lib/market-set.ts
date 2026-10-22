/** 링크로 넘겨받은 시장 묶음. Threads 자동 게시 글이 소개한 시장만 지도에 띄울 때 쓴다. */
export interface MarketSetLink {
  ids: string[];
  /** utm_source, 없으면 "direct". */
  source: string;
}

const MAX_IDS = 10;

export function parseMarketSetLink(params: URLSearchParams): MarketSetLink | null {
  const ids = [...new Set((params.get("markets") ?? "").split(",").map((id) => id.trim()).filter(Boolean))].slice(0, MAX_IDS);
  if (ids.length === 0) return null;
  return { ids, source: params.get("utm_source")?.trim() || "direct" };
}
