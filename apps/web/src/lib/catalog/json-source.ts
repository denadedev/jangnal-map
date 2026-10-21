import { publicMarkets } from "../market-catalog";
import { marketEditorialEntries } from "../market-editorial";
import { sortMarkets, type CatalogSnapshot } from "./catalog";

export function loadJsonSnapshot(): CatalogSnapshot {
  return { markets: sortMarkets(publicMarkets), editorial: marketEditorialEntries };
}
