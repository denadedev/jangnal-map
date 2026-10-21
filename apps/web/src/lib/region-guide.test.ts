import { describe, expect, it } from "vitest";

import { createCatalog } from "./catalog/catalog";
import { loadJsonSnapshot } from "./catalog/json-source";
import { findRegionBySlug } from "./region";

const catalog = createCatalog(loadJsonSnapshot());
const guideFor = (slug: string) => catalog.getRegionGuide(findRegionBySlug(slug)!);

describe("region guide rules", () => {
  it("writes the introduction from the region's market data", () => {
    expect(guideFor("gyeongbuk").paragraphs).toEqual([
      "경북에는 이 사이트 기준으로 날짜 끝자리에 맞춰 장이 서는 정기 장날 시장이 79곳 있어요. 20개 시·군에 흩어져 있고, 경주시가 11곳으로 가장 많아요. 79곳 중 66곳은 공공데이터에 상설장으로도 등록된 시장이에요.",
      "끝자리별로는 2·7일장이 23곳으로 가장 많고, 1·6일장이 11곳으로 가장 적어요. 그래서 어느 날 찾아가도 경북 어딘가에는 장이 서지만, 열리는 장의 수는 날짜마다 달라요. 경주시에는 끝자리가 다른 장이 4가지라, 같은 시·군 안에서도 날짜를 바꿔 가며 여러 장을 둘러볼 수 있어요.",
    ]);
    expect(guideFor("jeonnam").paragraphs[0]).toContain("해남군이 7곳으로 가장 많아요");
    expect(guideFor("gangwon").paragraphs[0]).toContain("23곳 모두 공공데이터에 상설장으로도 등록된 시장이에요.");
  });

  it("skips the district tour sentence below four day patterns", () => {
    expect(guideFor("chungnam").paragraphs[1]).not.toContain("끝자리가 다른 장이");
  });

  it("highlights the three markets with the most Onnuri merchants", () => {
    const { highlights } = guideFor("gyeongbuk");
    const counts = highlights.map(({ marketId }) => catalog.findMarketById(marketId)!.onnuri!.totalCount);

    expect(highlights).toHaveLength(3);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(
      Math.max(...catalog.getRegionMarkets("gyeongbuk")
        .filter((market) => !highlights.some(({ marketId }) => marketId === market.id))
        .map((market) => market.onnuri?.totalCount ?? 0)),
    );
    expect(highlights[0].note).toBe("2·7일장, 공공데이터 시장 유형 상설장, 온누리상품권 가맹점 225곳(2025년 7월 기준)");
  });

  it("states parking, the data date and the public sources", () => {
    const guide = guideFor("gyeongbuk");

    expect(guide.visitTips[0]).toMatch(/^79곳 중 74곳은 공공데이터에 주차장이 있다고 나와요\./);
    expect(guide.visitTips[1]).toContain("자료 기준일이 2025년 11월 10일이라");
    expect(guide.basisDate).toBe("2025-11-10");
    expect(guide.sources.map(({ name }) => name)).toEqual([
      "공공데이터포털 전국전통시장표준데이터",
      "소상공인시장진흥공단 전국 온누리상품권 가맹점 현황",
    ]);
  });
});
