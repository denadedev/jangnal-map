import { isDeepStrictEqual } from "node:util";

import type { CatalogSnapshot } from "../lib/catalog/catalog";

/**
 * DB에서 읽은 스냅샷이 JSON과 같은지 비교해 다른 항목을 돌려준다.
 * 같은 URL에 이름이 여럿이던 출처는 시드에서 하나로 합쳤으므로(스키마 문서 결정 10) DB 쪽 이름으로 맞춰 비교한다.
 */
export function snapshotDifferences(fromDb: CatalogSnapshot, fromJson: CatalogSnapshot): string[] {
  const differences: string[] = [];
  if (fromDb.markets.length !== fromJson.markets.length) {
    differences.push(`markets: ${fromDb.markets.length} in DB, ${fromJson.markets.length} in JSON`);
  }
  fromJson.markets.forEach((market, index) => {
    if (!isDeepStrictEqual(fromDb.markets[index], market)) differences.push(`market ${market.id}`);
  });

  const sourceNames = new Map(fromDb.editorial.flatMap((entry) => entry.sources.map((source) => [source.url, source.name] as const)));
  const dbEditorial = new Map(fromDb.editorial.map((entry) => [entry.marketId, entry]));
  if (fromDb.editorial.length !== fromJson.editorial.length) {
    differences.push(`editorial: ${fromDb.editorial.length} in DB, ${fromJson.editorial.length} in JSON`);
  }
  for (const entry of fromJson.editorial) {
    const expected = { ...entry, sources: entry.sources.map((source) => ({ ...source, name: sourceNames.get(source.url) ?? source.name })) };
    if (!isDeepStrictEqual(dbEditorial.get(entry.marketId), expected)) differences.push(`editorial ${entry.marketId}`);
  }
  return differences;
}
