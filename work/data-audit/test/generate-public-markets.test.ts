import { describe, expect, it } from "vitest";

import { generatePublicMarkets } from "../src/generate-public-markets.js";
import { normalizeMarket } from "../src/normalize-market.js";
import { readMarketsCsv } from "../src/read-csv.js";

describe("generatePublicMarkets", () => {
  it("게시 가능한 시장만 남기고 10일을 달력 끝값 0으로 정규화한다", async () => {
    const rawRows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");
    const periodicRaw = { ...rawRows[0]!, 시장명: "5일장시장", 시장유형: "5일장", 시장개설주기: "5일+10일" };
    const normalizedRows = [normalizeMarket(periodicRaw), normalizeMarket(rawRows[1]!)];

    expect(generatePublicMarkets([periodicRaw, rawRows[1]!], normalizedRows)).toEqual([
      expect.objectContaining({
        name: "5일장시장",
        scheduleRaw: "5일+10일",
        schedule: { kind: "digit-pair", days: [5, 0] },
        latitude: 38.0899666,
        longitude: 127.2722253,
      }),
    ]);
  });
});
