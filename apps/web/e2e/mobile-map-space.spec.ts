import { expect, test } from "@playwright/test";

test("fills the screen with the map and keeps controls compact", async ({ page }) => {
  await page.goto("/?when=all");
  await expect(page.locator(".map-stage")).toBeVisible();
  const layout = await page.evaluate(() => {
    const map = document.querySelector(".map-stage")?.getBoundingClientRect();
    const controls = document.querySelector(".mobile-home-controls")?.getBoundingClientRect();
    const sheet = document.querySelector(".results-sheet")?.getBoundingClientRect();
    return { mapHeight: map?.height ?? 0, controlsBottom: controls?.bottom ?? 0, sheetTop: sheet?.top ?? 0, viewport: window.innerHeight };
  });
  expect(layout.mapHeight).toBeGreaterThanOrEqual(layout.viewport - 1);
  expect(layout.controlsBottom).toBeLessThanOrEqual(120);
  expect(layout.sheetTop - layout.controlsBottom).toBeGreaterThanOrEqual(500);
});

test("moves the results sheet between map, half, and list views", async ({ page }) => {
  await page.goto("/?when=all");
  const grid = page.locator(".explorer-grid");
  const handle = page.getByRole("button", { name: "시트 손잡이" });
  await expect(grid).toHaveAttribute("data-sheet-snap", "collapsed");
  await handle.click();
  await expect(grid).toHaveAttribute("data-sheet-snap", "half");
  await handle.click();
  await expect(grid).toHaveAttribute("data-sheet-snap", "full");
  await expect(page.getByRole("heading", { name: "오늘, 어디 장이 설까요?" })).toBeInViewport();
  await page.getByRole("group", { name: "결과 보기" }).getByRole("button", { name: "지도" }).click();
  await expect(grid).toHaveAttribute("data-sheet-snap", "collapsed");
});

test("scrolls results inside the sheet without moving the page", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("group", { name: "결과 보기" }).getByRole("button", { name: "목록" }).click();
  const body = page.locator(".results-sheet-body");
  await body.evaluate((element) => { element.scrollTop = 400; });
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);
});

test("keeps mobile visit guides reachable below results", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("group", { name: "결과 보기" }).getByRole("button", { name: "목록" }).click();
  const guides = page.locator(".mobile-market-results .reviewed-market-guides");
  const toggle = guides.locator("summary");
  await toggle.scrollIntoViewIfNeeded();
  await expect(guides.locator("details")).not.toHaveAttribute("open");
  await toggle.click();
  await expect(guides.locator("details")).toHaveAttribute("open");
  await expect(guides.locator("a").first()).toBeVisible();
});
