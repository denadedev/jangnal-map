import assert from "node:assert/strict";

// Run only against the local test container with synthetic runtime SMTP values.
const base = process.argv[2] || "http://127.0.0.1:3100";
const expectedSource = process.argv[3] || "json";
const expectedEmail = "runtime-smoke@example.invalid";
async function get(path, status = 200) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, status, path);
  return response.text();
}
const home = await get("/");
const report = await get("/report");
assert.ok(report.includes(expectedEmail), "/report must use runtime email, not build-time settings");
// Legal Hub 장애 시에도 같은 제목의 대체 화면이 나오므로 제목만 확인한다.
for (const [route, title] of [["/privacy", "개인정보 처리방침"], ["/terms", "이용약관"]]) {
  const html = await get(route);
  assert.ok(html.includes(`<h1>`) && html.includes(title), `${route} must render the ${title} document`);
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
const health = JSON.parse(await get("/api/health"));
assert.equal(health.source, expectedSource, "/api/health must report the configured catalog source");
const marketsResponse = await fetch(new URL("/api/markets", base), { signal: AbortSignal.timeout(15000) });
assert.equal(marketsResponse.status, 200, "/api/markets");
assert.match(marketsResponse.headers.get("cache-control") ?? "", /s-maxage=3600/);
const markets = await marketsResponse.json();
assert.ok(Array.isArray(markets) && markets.length === health.markets && markets.length > 1000, "/api/markets must list every market");
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
console.log(`PASS (${expectedSource}): runtime email, pages, market detail, metadata, market API, health, assets, 404 and API origin rejection`);
