import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import { generatePublicMarkets } from "../src/generate-public-markets.js";
import { readMarketsCsv } from "../src/read-csv.js";

describe("generatePublicMarkets", () => {
  it("게시 가능한 시장만 남기고 10일을 달력 끝값 0으로 정규화한다", async () => {
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
      latitude: number;
      longitude: number;
      schedule: { kind: string; days: [number, number] };
      scheduleRaw: string;
    }>;

    expect(artifact).toHaveLength(400);
    expect(new Set(artifact.map(({ id }) => id)).size).toBe(400);
    expect(artifact.every(({ id }) => id.length > 0)).toBe(true);
    expect(artifact.every(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude))).toBe(true);
    expect(artifact.every(({ schedule }) => schedule.kind === "digit-pair")).toBe(true);
    expect(artifact.every(({ schedule: { days } }) => (days[0] === 5 && days[1] === 0) || days[1] === days[0] + 5)).toBe(true);
    expect(artifact.filter(({ scheduleRaw }) => scheduleRaw === "5일+10일").every(({ schedule }) => String(schedule.days) === "5,0")).toBe(true);
  });
});
