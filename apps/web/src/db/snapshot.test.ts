import { describe, expect, it } from "vitest";

import { loadJsonSnapshot } from "../lib/catalog/json-source";
import { publicMarkets } from "../lib/market-catalog";
import { marketEditorialEntries } from "../lib/market-editorial";
import { snapshotDifferences } from "./parity";
import { buildSeedRows } from "./seed-rows";
import { assembleSnapshot } from "./snapshot";

describe("DB snapshot", () => {
  const { rows } = buildSeedRows(publicMarkets, marketEditorialEntries);

  it("turns seeded rows back into the JSON the pages read", () => {
    const fromDb = assembleSnapshot(rows);

    expect(snapshotDifferences(fromDb, loadJsonSnapshot())).toEqual([]);
    expect(fromDb.markets.find((market) => market.id === "market-2adc6a0bdfc73a7b")?.scheduleSource?.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("maps codes back to labels and sorts 5·10 days with 0 last", () => {
    const fromDb = assembleSnapshot(rows);
    const fiveTen = fromDb.markets.find((market) => market.schedule.kind === "digit-pair" && market.schedule.days.includes(0))!;

    expect(fiveTen.schedule).toMatchObject({ days: [5, 0] });
    expect(new Set(fromDb.markets.map((market) => market.status))).toEqual(new Set(["운영", "폐장"].filter((status) => publicMarkets.some((market) => market.status === status))));
    expect(fromDb.markets.every((market) => !/^[a-z-]+$/.test(market.marketType))).toBe(true);
  });

  it("reports a guide missing from the DB", () => {
    const draft = { ...rows, marketGuides: rows.marketGuides.slice(1) };
    const fromDb = assembleSnapshot(draft);

    expect(snapshotDifferences(fromDb, loadJsonSnapshot())).toEqual([
      "editorial: 54 in DB, 55 in JSON",
      `editorial ${marketEditorialEntries.find((entry) => !fromDb.editorial.some(({ marketId }) => marketId === entry.marketId))!.marketId}`,
    ]);
  });
});
