import { publicMarkets } from "../market-catalog";
import { marketEditorialEntries } from "../market-editorial";
import { sortMarkets, type CatalogSnapshot } from "./catalog";

// 시드용 JSON(data/)을 화면 스냅샷 모양으로 만든다. `pnpm db:parity`의 비교 기준과 테스트에서만 쓴다.
export function loadJsonSnapshot(): CatalogSnapshot {
  // JSON에는 방문자 제보가 없다.
  return { markets: sortMarkets(publicMarkets), editorial: marketEditorialEntries, highlights: [] };
}
