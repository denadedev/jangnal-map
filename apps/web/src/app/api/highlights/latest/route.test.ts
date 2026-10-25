import { describe, expect, it, vi } from "vitest";

import { createCatalog } from "../../../../lib/catalog/catalog";
import { loadJsonSnapshot } from "../../../../lib/catalog/json-source";

const snapshot = loadJsonSnapshot();
const older = { marketId: "market-389b4a24f06ccd11", name: "백암순대", description: null, category: "food" as const, createdAt: "2026-10-20T00:00:00.000Z" };
const newer = { ...older, name: "참기름", category: "specialty" as const, createdAt: "2026-10-24T09:00:00.000Z" };
const highlights = { current: [older, newer] };
vi.mock("../../../../lib/catalog/load", () => ({ loadCatalog: async () => createCatalog({ ...snapshot, highlights: highlights.current }) }));

const { GET } = await import("./route");

describe("GET /api/highlights/latest", () => {
  it("returns the most recently approved visitor story without caching", async () => {
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ highlight: newer });
  });

  it("returns null when nothing has been approved yet", async () => {
    highlights.current = [];
    expect(await (await GET()).json()).toEqual({ highlight: null });
  });
});
