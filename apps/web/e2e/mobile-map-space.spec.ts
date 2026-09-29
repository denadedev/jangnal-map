import { expect, test } from "@playwright/test";

test("keeps the map and results in the same scrollable mobile page", async ({ page }) => {
  await page.goto("/?when=all");
  await expect(page.locator(".map-stage")).toBeVisible();
  await expect(page.locator(".mobile-market-results")).toBeVisible();
  await expect(page.locator(".mobile-market-sheet.is-results")).toHaveCount(0);
  const layout = await page.evaluate(() => {
    const map = document.querySelector(".map-stage")?.getBoundingClientRect();
    const results = document.querySelector(".mobile-market-results")?.getBoundingClientRect();
    const scroll = document.querySelector(".explorer-grid");
    return { mapBottom: map?.bottom ?? 0, resultsTop: results?.top ?? 0, scrollable: Boolean(scroll && scroll.scrollHeight > scroll.clientHeight) };
  });
  expect(layout.resultsTop).toBeGreaterThanOrEqual(layout.mapBottom);
  expect(layout.scrollable).toBe(true);
});

test("scrolls the discovery heading with both map and list results", async ({ page }) => {
  await page.goto("/?when=all");
  const scroll = page.locator(".explorer-grid");
  const heading = page.getByRole("heading", { name: "오늘, 어디 장이 설까요?" });
  const navigation = page.getByRole("navigation", { name: "주요 화면" });

  for (const view of ["지도", "목록"]) {
    await navigation.getByRole("button", { name: view }).click();
    await scroll.evaluate((element) => { element.scrollTop = 0; });
    const before = await heading.evaluate((element) => element.getBoundingClientRect().top);
    await scroll.evaluate((element) => { element.scrollTop = 140; });
    await expect.poll(() => heading.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(before - 100);
  }
});

test("keeps navigation visible while map and results scroll in short viewports", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 430, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/?when=all");
    const navigation = page.getByRole("navigation", { name: "주요 화면" });
    await expect(navigation).toBeVisible();
    await expect(page.locator(".map-stage")).toBeVisible();
    const layout = await page.evaluate(() => {
      const nav = document.querySelector(".mobile-primary-nav")?.getBoundingClientRect();
      const scroll = document.querySelector(".explorer-grid")?.getBoundingClientRect();
      return { navBottom: nav?.bottom ?? 0, scrollBottom: scroll?.bottom ?? 0, overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    expect(layout.navBottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(layout.scrollBottom).toBeLessThanOrEqual(layout.navBottom + 1);
    expect(layout.overflow).toBeLessThanOrEqual(0);
  }
});

test("keeps mobile visit guides reachable below results", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "목록" }).click();
  const guides = page.locator(".mobile-market-results .reviewed-market-guides");
  const toggle = guides.getByRole("button", { name: /시장별 방문 정보/ });
  await toggle.scrollIntoViewIfNeeded();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(guides.locator("a").first()).toBeVisible();
});
