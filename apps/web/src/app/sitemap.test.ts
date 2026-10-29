import { describe, expect, it, vi } from "vitest";

import { createCatalog } from "../lib/catalog/catalog";
import { loadJsonSnapshot } from "../lib/catalog/json-source";
import { SITE_URL } from "../lib/market-seo";

const snapshot = loadJsonSnapshot();
vi.mock("../lib/catalog/load", () => ({
  loadCatalog: async () => createCatalog({
    ...snapshot,
    highlights: [{ marketId: "market-389b4a24f06ccd11", name: "백암순대", description: null, category: "specialty", createdAt: "2099-01-02T03:04:05.000Z" }],
  }),
}));

const { default: sitemap } = await import("./sitemap");

describe("sitemap", () => {
  it("moves lastModified to the latest approved visitor story, as a YYYY-MM-DD date", async () => {
    const entries = await sitemap();

    expect(entries.find(({ url }) => url === `${SITE_URL}${encodeURI("/markets/용인중앙시장-389b4a24")}`)?.lastModified).toBe("2099-01-02");
  });
});
