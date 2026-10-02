import { expect, test } from "@playwright/test";

test("jumps from the home shortcut to visit guides after market loading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".market-list a").first()).toBeVisible();
  await page.getByRole("link", { name: "시장별 방문 정보", exact: true }).click();
  await expect(page.getByRole("heading", { name: "시장별 방문 정보" })).toBeInViewport();
});

test("offers meaningful guides and navigation without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 844 } });
  const page = await context.newPage();
  try {
    const response = await page.goto(`${baseURL}/`);
    const html = await response!.text();
    expect(html).not.toContain("1/15");
    expect(html).not.toContain("2000-01-15");
    expect(html).not.toContain("시장 0곳");
    const guides = page.getByRole("region", { name: "시장별 방문 정보" });
    await expect(guides.locator(".reviewed-market-previews a")).toHaveCount(5);
    await expect(guides.locator(".reviewed-market-previews p").first()).toBeVisible();
    await guides.locator("summary").click();
    await expect(guides.locator("details a").first()).toBeVisible();
    await expect(guides.locator("a")).toHaveCount(30);
    await expect(page.getByRole("link", { name: "데이터 출처와 편집 기준" })).toBeVisible();
    await guides.getByRole("link", { name: /용인중앙시장/ }).click();
    await expect(page.getByRole("heading", { name: "한눈에 보는 시장 특징" })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("distinguishes loading, failure and real empty search results", async ({ page }) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/data/markets.json", async (route) => {
    await pending;
    await route.abort();
  });
  await page.goto("/");
  const results = page.getByRole("region", { name: "시장 결과" });
  await expect(results.getByRole("status")).toContainText("시장 정보를 불러오는 중");
  await expect(results).not.toContainText("시장 0곳");
  release();
  await expect(results.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(results).not.toContainText("시장 0곳");
  await page.unroute("**/data/markets.json");
  await results.getByRole("button", { name: "다시 시도" }).click();
  await expect(results.locator(".market-list a").first()).toBeVisible();
  await page.goto("/?q=없는시장테스트문자열");
  await expect(results.getByRole("heading", { name: "조건에 맞는 시장 0곳" })).toBeVisible();
});

const noAdScriptPaths = [
  "/",
  "/onnuri",
  "/about",
  "/privacy",
  "/report?kind=service",
  "/this-page-does-not-exist",
];

test("does not load AdSense ads on any approval-review route", async ({ page }) => {
  for (const path of noAdScriptPaths) {
    await page.goto(path);
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute(
      "content",
      "ca-pub-3237088758901901",
    );
    await expect(page.locator('script[src*="googlesyndication"]')).toHaveCount(0);
    await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);
    await expect(page.locator('iframe[src*="google"]')).toHaveCount(0);
  }
});

test("publishes the canonical connection files", async ({ page }) => {
  const adsTxt = await page.request.get("/ads.txt");
  expect(adsTxt.status()).toBe(200);
  expect(await adsTxt.text()).toBe("google.com, pub-3237088758901901, DIRECT, f08c47fec0942fa0\n");

  const robots = await page.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("https://kmarketday.com/sitemap.xml");

  const sitemap = await page.request.get("/sitemap.xml");
  const sitemapText = await sitemap.text();
  expect(sitemap.status()).toBe(200);
  expect((sitemapText.match(/<loc>/g) ?? []).length).toBe(34);
  expect(sitemapText).not.toContain("spamfam.kr");
  expect(sitemapText).not.toContain("jangnal.spamfam.kr");
  expect(sitemapText).not.toContain("jangnal-map.vercel.app");
});

test("serves reviewed details and keeps unreviewed details out of the site", async ({ page }) => {
  const reviewed = await page.goto("/markets/용인중앙시장-389b4a24");
  expect(reviewed?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "한눈에 보는 시장 특징" })).toBeVisible();

  const unreviewed = await page.goto("/markets/운천전통시장-45b640cc");
  expect(unreviewed?.status()).toBe(404);

  await page.goto("/?when=all&market=market-45b640ccbe294100");
  await expect(page.getByRole("article", { name: /운천전통시장/ })).toBeVisible();
});
