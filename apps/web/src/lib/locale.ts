import type { DateFilterMode } from "../components/market-filters";

export type Locale = "ko" | "en";

export interface ExplorerPathState {
  query: string;
  mode: DateFilterMode;
  marketId: string | null;
  /** Threads 링크로 들어온 시장 묶음. 풀기 전까지 URL에 남겨 뒤로가기가 그 화면으로 돌아오게 한다. */
  marketSet?: string[] | null;
}

export function getMapPath(locale: Locale): string {
  return locale === "en" ? "/en/map" : "/";
}

export function buildExplorerPath(locale: Locale, state: ExplorerPathState): string {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.mode !== "today") params.set("when", state.mode);
  if (state.marketSet) params.set("markets", state.marketSet.join(","));
  if (state.marketId) params.set("market", state.marketId);
  const query = params.toString();
  const path = getMapPath(locale);
  return query ? `${path}?${query}` : path;
}
