import type { DateFilterMode } from "../components/market-filters";

export type Locale = "ko" | "en";

export interface ExplorerPathState {
  query: string;
  mode: DateFilterMode;
  directDate: string;
  marketId: string | null;
}

export function getMapPath(locale: Locale): string {
  return locale === "en" ? "/en/map" : "/";
}

export function buildExplorerPath(locale: Locale, state: ExplorerPathState): string {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.mode !== "week") params.set("when", state.mode);
  if (state.mode === "date") params.set("date", state.directDate);
  if (state.marketId) params.set("market", state.marketId);
  const query = params.toString();
  const path = getMapPath(locale);
  return query ? `${path}?${query}` : path;
}
