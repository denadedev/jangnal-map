import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runAudit } from "../src/cli.js";

describe("runAudit", () => {
  it("CSV에서 품질 보고서와 게시 가능한 지도 샘플을 생성한다", async () => {
    const outputDirectory = join("tmp", "cli-test");
    const reportPath = join(outputDirectory, "report.md");
    const samplePath = join(outputDirectory, "sample.json");

    const summary = await runAudit({
      input: "data/fixtures/markets.csv",
      encoding: "utf8",
      report: reportPath,
      sample: samplePath,
    });

    const report = await readFile(reportPath, "utf8");
    const sample = JSON.parse(await readFile(samplePath, "utf8")) as Array<Record<string, unknown>>;

    expect(summary).toEqual({ rows: 2, candidates: 1, publishable: 1, verdict: "사용 가능" });
    expect(report).toContain("장날 파싱 가능률: 1/1 (100.0%)");
    expect(report).toContain("바로 게시 가능한 시장: 1/1 (100.0%)");
    expect(report).toContain("전체 시장의 유효 좌표: 1/2 (50.0%)");
    expect(report).toContain("원본에는 운영·폐장 상태 필드가 없다");
    expect(sample).toHaveLength(1);
    expect(sample[0]).toMatchObject({
      name: "운천전통시장",
      scheduleRaw: "4일+9일",
      schedule: { kind: "digit-pair", days: [4, 9] },
      status: "운영",
      statusVerified: false,
    });
  });
});
