import { describe, expect, it, vi } from "vitest";

import { createCatalog } from "../../../lib/catalog/catalog";
import { loadJsonSnapshot } from "../../../lib/catalog/json-source";

const story = { marketId: "market-389b4a24f06ccd11", name: "백암순대", description: "국밥이 맛있어요", category: "food" as const, createdAt: "2026-10-20T00:00:00.000Z" };
vi.mock("../../../lib/catalog/load", () => ({ loadCatalog: async () => createCatalog({ ...loadJsonSnapshot(), highlights: [story] }) }));

const { POST } = await import("./route");

let nextId = 1;
async function rpc(method: string, params: Record<string, unknown> = {}) {
  const response = await POST(new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  }));
  expect(response.status).toBe(200);
  return (await response.json()) as { result: any };
}

const callTool = async (name: string, args: Record<string, unknown>) => {
  const { result } = await rpc("tools/call", { name, arguments: args });
  return { ...result, data: JSON.parse(result.content[0].text) };
};

describe("POST /api/mcp", () => {
  it("answers initialize without a session", async () => {
    const { result } = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" },
    });
    expect(result.serverInfo.name).toBe("jangnal-map");
    expect(result.capabilities.tools).toBeDefined();
  });

  it("lists the two read-only tools", async () => {
    const { result } = await rpc("tools/list");
    expect(result.tools.map((tool: { name: string }) => tool.name)).toEqual(["find_markets", "get_market"]);
    expect(result.tools.every((tool: { annotations: { readOnlyHint: boolean } }) => tool.annotations.readOnlyHint)).toBe(true);
  });

  it("finds markets open on a date in a province, nearest first, with tracked links", async () => {
    const { data } = await callTool("find_markets", { date: "2026-11-10", query: "충남", latitude: 36.6, longitude: 126.66, limit: 3 });
    expect(data.date).toBe("2026-11-10");
    expect(data.total).toBeGreaterThan(3);
    expect(data.markets).toHaveLength(3);
    for (const market of data.markets) {
      expect(market.region).toBe("충남");
      expect(market.schedule).toContain("10일");
      expect(new URL(market.url).searchParams.get("utm_source")).toBe("mcp");
    }
    const distances = data.markets.map((market: { distanceKm: number }) => market.distanceKm);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("matches a market name and leaves out markets closed that day", async () => {
    const open = await callTool("find_markets", { date: "2026-11-10", query: "용인중앙" });
    expect(open.data.markets.map((market: { id: string }) => market.id)).toContain("market-389b4a24f06ccd11");
    const closed = await callTool("find_markets", { date: "2026-11-11", query: "용인중앙" });
    expect(closed.data.markets.map((market: { id: string }) => market.id)).not.toContain("market-389b4a24f06ccd11");
  });

  it("rejects a malformed date", async () => {
    const result = await callTool("find_markets", { date: "11/10" });
    expect(result.isError).toBe(true);
  });

  it("returns one market with upcoming dates and visitor stories", async () => {
    const { data } = await callTool("get_market", { id: "market-389b4a24f06ccd11" });
    expect(data.name).toBe("용인중앙시장");
    expect(data.nextMarketDates.length).toBeGreaterThan(0);
    expect(data.nextMarketDates.every((date: string) => /[50]$/.test(date))).toBe(true);
    expect(data.visitorStories).toEqual([{ category: "먹거리", name: "백암순대", description: "국밥이 맛있어요" }]);
  });

  it("reports an unknown market id as a tool error", async () => {
    const result = await callTool("get_market", { id: "market-nope" });
    expect(result.isError).toBe(true);
  });
});
