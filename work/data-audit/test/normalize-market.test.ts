import { describe, expect, it } from "vitest";

import { normalizeMarket } from "../src/normalize-market.js";
import { readMarketsCsv } from "../src/read-csv.js";

describe("normalizeMarket", () => {
  it("텍스트·숫자·품목·주차 여부를 서비스용 값으로 정규화한다", async () => {
    const [raw] = await readMarketsCsv("data/fixtures/markets.csv", "utf8");

    expect(normalizeMarket(raw!)).toMatchObject({
      name: "운천전통시장",
      marketType: "상설장+4일장",
      scheduleRaw: "4일+9일",
      latitude: 38.0899666,
      longitude: 127.2722253,
      storeCount: 48,
      products: ["농산물"],
      hasParking: true,
      status: "운영",
      statusVerified: false,
    });
  });

  it("빈 좌표와 주소를 null로 보존한다", async () => {
    const rows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");

    expect(normalizeMarket(rows[1]!)).toMatchObject({
      lotAddress: null,
      latitude: null,
      longitude: null,
    });
  });
});
