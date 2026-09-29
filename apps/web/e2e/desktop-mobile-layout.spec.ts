import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 850 }, isMobile: false, hasTouch: false });

test("uses the current mobile map, list, and search flow on desktop", async ({ page }) => {
  await page.goto("/?when=all");
  const shell = page.locator(".explorer-shell");
  await expect(page.locator(".app-header")).toBeHidden();
  await expect(page.locator(".mobile-market-results")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "주요 화면" })).toBeVisible();
  expect(await shell.boundingBox()).toMatchObject({ x: 425, width: 430 });

  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "검색" }).click();
  const searchScreen = page.getByRole("dialog", { name: "시장 검색" });
  expect(await searchScreen.boundingBox()).toMatchObject({ x: 425, width: 430 });
  await searchScreen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("통복시장");
  await searchScreen.getByRole("button", { name: /전체 결과 보기/ }).click();
  await page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first().click();
  expect(await page.locator(".mobile-market-sheet.is-detail").boundingBox()).toMatchObject({ x: 425, width: 430 });
});

test("keeps mobile headers and fixed market actions inside the desktop column", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator(".mobile-app-bar")).toBeVisible();
  await expect(page.locator(".desktop-route-header")).toBeHidden();

  await page.goto("/markets/용인중앙시장-389b4a24");
  const action = await page.locator("[data-mobile-primary-action]").boundingBox();
  expect(action?.x).toBeGreaterThanOrEqual(425);
  expect((action?.x ?? 0) + (action?.width ?? 0)).toBeLessThanOrEqual(855);
});

test("keeps the mobile menu and date picker inside the desktop column", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  expect(await page.locator(".mobile-menu-backdrop").boundingBox()).toMatchObject({ x: 425, width: 430 });

  await page.goto("/?when=date&date=2026-09-30&market=market-1181d511e9973d14");
  await page.getByRole("dialog", { name: /통복시장 상세/ }).getByRole("button", { name: "방문 날짜 바꾸기" }).click();
  expect(await page.locator(".mobile-date-picker-overlay").boundingBox()).toMatchObject({ x: 425, width: 430 });
});
