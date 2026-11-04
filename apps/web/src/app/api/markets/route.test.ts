import { gunzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";

import { createCatalog } from "../../../lib/catalog/catalog";
import { loadJsonSnapshot } from "../../../lib/catalog/json-source";

const catalog = createCatalog(loadJsonSnapshot());
vi.mock("../../../lib/catalog/load", () => ({ loadCatalog: async () => catalog }));

const { GET } = await import("./route");

const request = (acceptEncoding?: string) =>
  new Request("http://localhost/api/markets", { headers: acceptEncoding ? { "Accept-Encoding": acceptEncoding } : {} });

describe("GET /api/markets", () => {
  it("gzips the market list when the browser accepts it", async () => {
    const response = await GET(request("gzip, deflate, br"));
    expect(response.headers.get("Content-Encoding")).toBe("gzip");
    expect(response.headers.get("Vary")).toBe("Accept-Encoding");
    const body = Buffer.from(await response.arrayBuffer());
    expect(body.length).toBeLessThan(200_000);
    expect(JSON.parse(gunzipSync(body).toString("utf8"))).toEqual(catalog.markets);
  });

  it("sends plain JSON when gzip is not accepted", async () => {
    const response = await GET(request());
    expect(response.headers.get("Content-Encoding")).toBeNull();
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toEqual(catalog.markets);
  });

  it("lets the browser reuse the list for a short while", async () => {
    const response = await GET(request("gzip"));
    expect(response.headers.get("Cache-Control")).toContain("max-age=600");
  });
});
