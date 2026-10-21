import { publicMarkets } from "../market-catalog";
import { marketEditorialEntries } from "../market-editorial";
import { sortMarkets, type CatalogSnapshot } from "./catalog";

export function loadJsonSnapshot(): CatalogSnapshot {
  // JSON에는 방문자 제보가 없다.
  return { markets: sortMarkets(publicMarkets), editorial: marketEditorialEntries, highlights: [] };
}
