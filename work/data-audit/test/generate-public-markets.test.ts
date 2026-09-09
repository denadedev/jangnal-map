import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import { attachOnnuriSummaries, generatePublicMarkets } from "../src/generate-public-markets.js";
import type { OnnuriMerchantSummary } from "../src/onnuri-match.js";
import { readMarketsCsv } from "../src/read-csv.js";

describe("generatePublicMarkets", () => {
  it("시장 ID별 온누리 집계를 병합하고 미매칭 시장은 null로 둔다", async () => {
    const rawRows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");
    const generated = generatePublicMarkets(rawRows);
    const summary: OnnuriMerchantSummary = {
      totalCount: 2,
      digitalCount: 2,
      paperCount: 1,
      referenceDate: "2025-07-31",
      source: { name: "공공데이터포털", url: "https://www.data.go.kr/" },
    };

    const enriched = attachOnnuriSummaries(generated, new Map([[generated[0]!.id, summary]]));

    expect(enriched[0]!.onnuri).toEqual(summary);
    expect(enriched[1]!.onnuri).toBeNull();
    expect(enriched).not.toBe(generated);
  });

  it("매일 운영 및 좌표가 없는 시장도 공개 데이터에 보존한다", async () => {
    const rawRows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");
    const unknownRaw = {
      ...rawRows[1]!,
      시장명: "일정미확인시장",
      시장개설주기: "2일+4일+7일+9일",
    };

    const generated = generatePublicMarkets([rawRows[1]!, unknownRaw]);

    expect(generated).toHaveLength(2);
    expect(generated[0]).toMatchObject({
      schedule: { kind: "daily" },
      latitude: null,
      longitude: null,
    });
    expect(generated[1]).toMatchObject({
      schedule: { kind: "unknown", raw: "2일+4일+7일+9일" },
      latitude: null,
      longitude: null,
    });
  });

  it("모든 시장을 남기고 10일을 달력 끝값 0으로 정규화한다", async () => {
    const rawRows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");
    const periodicRaw = { ...rawRows[0]!, 시장명: "5일장시장", 시장유형: "5일장", 시장개설주기: "5일+10일" };
    expect(generatePublicMarkets([periodicRaw, rawRows[1]!])).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        name: "5일장시장",
        scheduleRaw: "5일+10일",
        schedule: { kind: "digit-pair", days: [5, 0] },
        latitude: 38.0899666,
        longitude: 127.2722253,
      }),
      expect.objectContaining({
        name: "의정부청과야채시장",
        schedule: { kind: "daily" },
        latitude: null,
        longitude: null,
      }),
    ]);
  });

  it("같은 원본에서 결정적인 고유 ID를 만든다", async () => {
    const rawRows = await readMarketsCsv("data/fixtures/markets.csv", "utf8");
    const periodicRaw = { ...rawRows[0]!, 시장개설주기: "5일+10일" };
    const first = generatePublicMarkets([periodicRaw]);
    const second = generatePublicMarkets([periodicRaw]);

    expect(first).toHaveLength(1);
    expect(first[0]!.id).toMatch(/^market-[a-f0-9]{16}$/);
    expect(first[0]!.id).toBe(second[0]!.id);
    expect(new Set(first.map(({ id }) => id)).size).toBe(first.length);
  });

  it("커밋된 공개 산출물이 게시 계약을 만족한다", async () => {
    const artifact = JSON.parse(await readFile("../../apps/web/public/data/markets.json", "utf8")) as Array<{
      id: string;
      latitude: number | null;
      longitude: number | null;
      schedule: { kind: string; days?: [number, number] };
      scheduleRaw: string;
      onnuri: null | {
        totalCount: number;
        digitalCount: number;
        paperCount: number;
        referenceDate: string;
      };
    }>;

    expect(artifact).toHaveLength(1393);
    expect(new Set(artifact.map(({ id }) => id)).size).toBe(1393);
    expect(artifact.every(({ id }) => id.length > 0)).toBe(true);
    expect(artifact.every(({ latitude, longitude }) =>
      (latitude === null && longitude === null) || (Number.isFinite(latitude) && Number.isFinite(longitude)))).toBe(true);
    expect(artifact.every(({ schedule }) => ["daily", "digit-pair", "unknown"].includes(schedule.kind))).toBe(true);
    expect(artifact.filter(({ schedule }) => schedule.kind === "digit-pair").every(({ schedule: { days } }) =>
      days !== undefined && ((days[0] === 5 && days[1] === 0) || days[1] === days[0] + 5))).toBe(true);
    expect(artifact.filter(({ scheduleRaw }) => scheduleRaw === "5일+10일").every(({ schedule }) => String(schedule.days) === "5,0")).toBe(true);
    expect(artifact.filter(({ onnuri }) => onnuri !== null)).toHaveLength(1_066);
    expect(artifact.every(({ onnuri }) => onnuri === null || (
      Number.isInteger(onnuri.totalCount)
      && onnuri.totalCount >= onnuri.digitalCount
      && onnuri.totalCount >= onnuri.paperCount
      && onnuri.referenceDate === "2025-07-31"
    ))).toBe(true);
  });
});
