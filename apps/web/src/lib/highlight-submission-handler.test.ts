import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCatalog } from "./catalog/catalog";
import { loadJsonSnapshot } from "./catalog/json-source";
import { createHighlightSubmissionHandler, type SubmissionDeps } from "./highlight-submission-handler";

const catalog = createCatalog(loadJsonSnapshot());
const market = catalog.markets[0];
const origin = "https://kmarketday.com";

const request = (body: unknown, headers: Record<string, string> = {}) => new Request(`${origin}/api/submissions`, {
  method: "POST",
  headers: { origin, "x-real-ip": "203.0.113.1", ...headers },
  body: typeof body === "string" ? body : JSON.stringify(body),
});
const valid = { market_id: market.id, name: "미나리", category: "specialty", description: "" };

function setup(overrides: Partial<SubmissionDeps> = {}, store: Partial<Awaited<ReturnType<SubmissionDeps["store"]>>> = {}) {
  const insert = vi.fn(async () => "submission-1");
  const notify = vi.fn(async () => undefined);
  const hasDuplicate = vi.fn(async () => false);
  const handler = createHighlightSubmissionHandler({
    catalog: async () => catalog,
    notify,
    allow: () => true,
    store: async () => ({ findMarketRowId: async () => "row-1", hasDuplicate, insert, ...store }),
    ...overrides,
  });
  return { handler, insert, notify, hasDuplicate };
}

beforeEach(() => {
  vi.stubEnv("REPORT_ALLOWED_ORIGINS", origin);
  for (const name of ["DATABASE_URL", "SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID"]) vi.stubEnv(name, "set");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/submissions", () => {
  it("stores a pending submission and asks Slack for approval", async () => {
    const { handler, insert, notify, hasDuplicate } = setup();
    const response = await handler(request({ ...valid, name: " 미나리 " }));

    expect(response.status).toBe(200);
    expect(hasDuplicate).toHaveBeenCalledWith("row-1", "미나리");
    expect(insert).toHaveBeenCalledWith("row-1", { name: "미나리", description: null, category: "specialty" });
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ submissionId: "submission-1", marketName: market.name, name: "미나리" }));
  });

  it("still answers 200 when Slack is down, leaving the submission pending", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { handler, insert } = setup({ notify: async () => { throw new Error("slack down"); } });
    expect((await handler(request(valid))).status).toBe(200);
    expect(insert).toHaveBeenCalled();
  });

  it("is closed until every secret is configured", async () => {
    vi.stubEnv("SLACK_BOT_TOKEN", "");
    const { handler, insert } = setup();
    expect((await handler(request(valid))).status).toBe(503);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects other origins", async () => {
    const { handler } = setup();
    expect((await handler(request(valid, { origin: "https://attacker.invalid" }))).status).toBe(403);
  });

  it("quietly accepts the honeypot without storing", async () => {
    const { handler, insert } = setup();
    expect((await handler(request({ ...valid, _gotcha: "bot" }))).status).toBe(200);
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...valid, name: "" }, 400, "invalid"],
    [{ ...valid, category: "맛집" }, 400, "invalid"],
    [{ ...valid, market_id: "market-missing" }, 400, "invalid"],
  ])("rejects %j", async (body, status, reason) => {
    const { handler, insert } = setup();
    const response = await handler(request(body));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ reason });
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a duplicate of a pending or published item", async () => {
    const { handler, insert } = setup({}, { hasDuplicate: async () => true });
    const response = await handler(request(valid));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ reason: "duplicate" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("limits each IP", async () => {
    const allow = vi.fn(() => false);
    const { handler } = setup({ allow });
    expect((await handler(request(valid))).status).toBe(429);
    expect(allow).toHaveBeenCalledWith("203.0.113.1");
  });

  it("reports a database failure without leaking details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { handler } = setup({}, { insert: async () => { throw new Error("connection refused"); } });
    const response = await handler(request(valid));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("connection");
  });
});
