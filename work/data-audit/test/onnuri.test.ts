import { describe, expect, it } from "vitest";

import { aggregateOnnuriMerchants, readOnnuriCsv } from "../src/onnuri.js";

describe("온누리상품권 가맹점 원본", () => {
  it("동일 점포의 중복 행을 하나의 전체 가맹점으로 집계한다", async () => {
    const rows = await readOnnuriCsv("test/fixtures/onnuri-merchants.csv", "utf8");

    const { aggregates } = aggregateOnnuriMerchants(rows);
    const aggregate = aggregates.find(({ marketName }) => marketName === "운천전통시장");

    expect(aggregate).toMatchObject({
      marketName: "운천전통시장",
      region: "경기도 포천시",
      totalCount: 2,
      digitalCount: 2,
      paperCount: 1,
    });
  });

  it("알 수 없는 가맹 여부 행을 집계에서 제외하고 검토 항목으로 남긴다", async () => {
    const rows = await readOnnuriCsv("test/fixtures/onnuri-merchants.csv", "utf8");

    const { aggregates, issues } = aggregateOnnuriMerchants(rows);

    expect(aggregates.some(({ marketName }) => marketName === "오류시장")).toBe(false);
    expect(issues).toEqual([
      { rowNumber: 6, field: "지류형 가맹 여부", value: "알수없음" },
    ]);
  });

  it("필수 열이 없으면 원본을 거부한다", async () => {
    await expect(readOnnuriCsv("test/fixtures/onnuri-missing-column.csv", "utf8"))
      .rejects.toThrow("CSV 필수 컬럼이 없습니다: 디지털형 가맹 여부");
  });
});
