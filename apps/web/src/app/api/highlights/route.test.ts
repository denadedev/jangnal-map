import { describe, expect, it, vi } from "vitest";

import { createCatalog } from "../../../lib/catalog/catalog";
import { loadJsonSnapshot } from "../../../lib/catalog/json-source";

const snapshot = loadJsonSnapshot();
const older = { marketId: "market-389b4a24f06ccd11", name: "백암순대", description: null, category: "food" as const, createdAt: "2026-10-20T00:00:00.000Z" };
const newer = { ...older, name: "참기름", category: "specialty" as const, createdAt: "2026-10-24T09:00:00.000Z" };
vi.mock("../../../lib/catalog/load", () => ({ loadCatalog: async () => createCatalog({ ...snapshot, highlights: [older, newer] }) }));

const { GET } = await import("./route");

describe("GET /api/highlights", () => {
  it("returns every approved visitor story, newest first, without caching", async () => {
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ highlights: [newer, older] });
  });
});
