import assert from "node:assert/strict";

// Run only against the local test container with synthetic runtime SMTP values.
const base = process.argv[2] || "http://127.0.0.1:3100";
const expectedEmail = "runtime-smoke@example.invalid";
async function get(path, status = 200) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, status, path);
  return response.text();
}
const home = await get("/");
for (const route of ["/report", "/privacy"]) {
  const html = await get(route);
  assert.ok(html.includes(expectedEmail), `${route} must use runtime email, not build-time settings`);
}
const sitemap = await get("/sitemap.xml");
const detail = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .find((path) => path.startsWith("/markets/"));
assert.ok(detail, "sitemap must contain a market detail");
await get(detail);
await get("/onnuri");
await get("/robots.txt");
await get("/manifest.webmanifest");
await get("/data/markets.json");
await get("/not-a-real-market-smoke-test", 404);
const assets = [...home.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)]
  .map((match) => match[1].replaceAll("&amp;", "&"));
assert.ok(assets.length > 0, "home must load static assets");
for (const asset of new Set(assets)) await get(asset);
// Invalid origin is rejected before any SMTP operation; this test sends no email.
const rejected = await fetch(new URL("/api/report", base), {
  method: "POST",
  headers: { Origin: "https://untrusted.example.invalid", "Content-Type": "application/json" },
  body: "{}",
  signal: AbortSignal.timeout(15000),
});
assert.equal(rejected.status, 403);
const accepted = await fetch(new URL("/api/report", base), {
  method: "POST",
  headers: { Origin: new URL(base).origin, "Content-Type": "application/json" },
  body: JSON.stringify({ _gotcha: "smoke-test-without-email" }),
  signal: AbortSignal.timeout(15000),
});
assert.equal(accepted.status, 200, "configured external Origin must pass behind port mapping");
console.log("PASS: runtime email, pages, market detail, metadata, assets, 404 and API origin rejection");
