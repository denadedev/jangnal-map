import { describe, expect, it } from "vitest";

import { readMarketsCsv } from "../src/read-csv.js";

describe("readMarketsCsv", () => {
  it("필수 컬럼을 가진 UTF-8 CSV의 모든 행을 읽는다", async () => {
    const rows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");

    expect(rows).toHaveLength(2);
    expect(rows[0]?.시장명).toBe("운천전통시장");
  });

  it("필수 컬럼이 없으면 조사를 중단한다", async () => {
    await expect(readMarketsCsv("test/fixtures/missing-columns.csv", "utf8")).rejects.toThrow(
      "CSV 필수 컬럼이 없습니다: 시장개설주기, 위도, 경도",
    );
  });
});

