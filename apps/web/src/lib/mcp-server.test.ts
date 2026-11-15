import { describe, expect, it } from "vitest";

import { createCatalog } from "./catalog/catalog";
import { loadJsonSnapshot } from "./catalog/json-source";
import { searchMarkets } from "./mcp-server";

const catalog = createCatalog(loadJsonSnapshot());
// 2026-11-16 07:00 KST: 1·6일장 날이라 광천(4·9일장)은 장이 안 선다.
const now = new Date("2026-11-15T22:00:00Z");

describe("searchMarkets", () => {
  it("gives the next market day for a market that is closed today", () => {
    const result = searchMarkets(catalog, { query: "광천 5일장" }, now);
    const gwangcheon = result.markets.find((market) => market.name === "광천전통시장");
    expect(result.today).toBe("2026-11-16");
    expect(gwangcheon).toMatchObject({ nextMarketDate: "2026-11-19", openToday: false });
  });

  it("marks a market that is open today", () => {
    const result = searchMarkets(catalog, { query: "공주산성시장" }, now);
    expect(result.markets[0]).toMatchObject({ name: "공주산성시장", nextMarketDate: "2026-11-16", openToday: true });
  });

  it("puts name matches and periodic markets before address-only matches", () => {
    const result = searchMarkets(catalog, { query: "모란장" }, now);
    expect(result.markets[0].name).toBe("모란종합시장");
  });
});
