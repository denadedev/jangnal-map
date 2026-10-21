// 두 배포(예: JSON 모드와 DB 모드, 또는 이전 이미지와 새 이미지)가 같은 내용을 내는지 비교한다.
// 사용법: node scripts/compare-sites.mjs <기준 URL> <비교 URL>
// 사이트맵의 모든 페이지는 화면 글자만, 시장 목록은 시장별로 비교한다. 다른 곳이 있으면 1로 끝난다.
import { isDeepStrictEqual } from "node:util";

const [baseA, baseB] = process.argv.slice(2);
if (!baseA || !baseB) {
  console.error("usage: node scripts/compare-sites.mjs <base-url> <candidate-url>");
  process.exit(2);
}

async function fetchText(base, path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30000) });
  return { status: response.status, body: await response.text() };
}

// 빌드마다 달라지는 스크립트·스타일 경로를 빼고 화면에 보이는 글자만 남긴다.
const visibleText = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const firstDifference = (a, b) => {
  let index = 0;
  while (index < a.length && a[index] === b[index]) index += 1;
  return { a: a.slice(Math.max(0, index - 40), index + 80), b: b.slice(Math.max(0, index - 40), index + 80) };
};

// 이전 이미지는 /api/markets가 없고 /data/markets.json만 있다.
async function fetchMarkets(base) {
  for (const path of ["/api/markets", "/data/markets.json"]) {
    const { status, body } = await fetchText(base, path);
    if (status === 200) return new Map(JSON.parse(body).map((market) => [market.id, market]));
  }
  throw new Error(`no market list at ${base}`);
}

const sitemapPaths = async (base) => [...(await fetchText(base, "/sitemap.xml")).body.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname);

const differences = [];
const [pathsA, pathsB] = await Promise.all([sitemapPaths(baseA), sitemapPaths(baseB)]);
for (const path of pathsA.filter((item) => !pathsB.includes(item))) differences.push(`only in ${baseA} sitemap: ${path}`);
for (const path of pathsB.filter((item) => !pathsA.includes(item))) differences.push(`only in ${baseB} sitemap: ${path}`);

for (const path of pathsA.filter((item) => pathsB.includes(item))) {
  const [a, b] = await Promise.all([fetchText(baseA, path), fetchText(baseB, path)]);
  if (a.status !== b.status) {
    differences.push(`${path}: status ${a.status} vs ${b.status}`);
    continue;
  }
  const [textA, textB] = [visibleText(a.body), visibleText(b.body)];
  if (textA !== textB) {
    const { a: snippetA, b: snippetB } = firstDifference(textA, textB);
    differences.push(`${path}: text differs\n    A: …${snippetA}…\n    B: …${snippetB}…`);
  }
}

const [marketsA, marketsB] = await Promise.all([fetchMarkets(baseA), fetchMarkets(baseB)]);
for (const [id, market] of marketsA) {
  if (!marketsB.has(id)) differences.push(`market list: ${id} missing in ${baseB}`);
  else if (!isDeepStrictEqual(market, marketsB.get(id))) differences.push(`market list: ${id} differs`);
}
for (const id of marketsB.keys()) if (!marketsA.has(id)) differences.push(`market list: ${id} only in ${baseB}`);

console.log(`Compared ${pathsA.length} sitemap pages and ${marketsA.size} markets.`);
if (differences.length > 0) {
  console.log(`${differences.length} differences:\n${differences.join("\n")}`);
  process.exit(1);
}
console.log("No differences.");
