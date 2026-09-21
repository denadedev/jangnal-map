import { expect, test } from "@playwright/test";

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
  expect(await robots.text()).toContain("https://spamfam.kr/sitemap.xml");

  const sitemap = await page.request.get("/sitemap.xml");
  const sitemapText = await sitemap.text();
  expect(sitemap.status()).toBe(200);
  expect((sitemapText.match(/<loc>/g) ?? []).length).toBe(33);
  expect(sitemapText).not.toContain("jangnal.spamfam.kr");
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
