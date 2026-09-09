import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { buildMapItems, type CoordinateBounds } from "./market-clusters";

const bounds: CoordinateBounds = { north: 39, south: 33, east: 132, west: 124 };

const marketAt = (id: string, latitude: number | null, longitude: number | null): PublicMarket => ({
  id,
  name: `${id}시장`,
  marketType: "상설장",
  roadAddress: null,
  lotAddress: null,
  latitude,
  longitude,
  scheduleRaw: "매일",
  schedule: { kind: "daily" },
  phone: null,
  hasParking: null,
  referenceDate: null,
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: { name: "테스트", url: "https://example.com", referenceDate: null },
});

describe("buildMapItems", () => {
  it("groups nearby markets at nationwide zoom", () => {
    const items = buildMapItems([
      marketAt("one", 37, 127),
      marketAt("two", 37.1, 127.1),
      marketAt("three", 37.2, 127.2),
    ], 7, bounds);

    expect(items).toEqual([
      expect.objectContaining({ kind: "cluster", count: 3 }),
    ]);
  });

  it("shows only in-bounds individual markets at local zoom", () => {
    const first = marketAt("one", 37, 127);
    const items = buildMapItems([
      first,
      marketAt("outside", 38, 128),
    ], 12, { north: 37.2, south: 36.8, east: 127.2, west: 126.8 });

    expect(items).toEqual([{ kind: "market", market: first }]);
  });

  it("omits markets without usable coordinates", () => {
    expect(buildMapItems([marketAt("missing", null, null)], 7, bounds)).toEqual([]);
  });
});
