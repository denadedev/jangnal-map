import { afterEach, describe, expect, it, vi } from "vitest";

import { createCatalog, type Catalog } from "./catalog";
import { createRevalidateHandler } from "./revalidate-handler";

const request = (token?: string) => new Request("http://localhost/api/revalidate", {
  method: "POST",
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});
const catalog = createCatalog({ markets: [], editorial: [], highlights: [] });

describe("revalidate endpoint", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off until a token is configured", async () => {
    vi.stubEnv("REVALIDATE_TOKEN", "");
    const refresh = vi.fn();

    expect((await createRevalidateHandler(refresh)(request("anything"))).status).toBe(404);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("rejects a wrong or missing token", async () => {
    vi.stubEnv("REVALIDATE_TOKEN", "secret-token");
    const refresh = vi.fn();
    const handler = createRevalidateHandler(refresh);

    expect((await handler(request("wrong"))).status).toBe(401);
    expect((await handler(request())).status).toBe(401);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("reloads the snapshot with the right token", async () => {
    vi.stubEnv("REVALIDATE_TOKEN", "secret-token");
    const response = await createRevalidateHandler(async () => catalog)(request("secret-token"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", markets: 0 });
  });

  it("answers 503 when the reload fails", async () => {
    vi.stubEnv("REVALIDATE_TOKEN", "secret-token");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const refresh = (): Promise<Catalog> => Promise.reject(new Error("db down"));

    expect((await createRevalidateHandler(refresh)(request("secret-token"))).status).toBe(503);
  });
});
