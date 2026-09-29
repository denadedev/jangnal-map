import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 850 }, isMobile: false, hasTouch: false });

test("closes detail after changing markets without reopening an older market", async ({ page }) => {
  await page.goto("/?when=all");
  const results = page.locator(".mobile-market-results .market-list-item");
  const detail = page.locator(".mobile-market-sheet .market-detail");
  await results.nth(0).click();
  const firstName = await detail.getByRole("heading", { level: 2 }).innerText();
  await page.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await results.nth(1).click();
  await expect(detail.getByRole("heading", { level: 2 })).not.toHaveText(firstName);

  await page.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await expect(detail).toHaveCount(0);
  await expect(page).not.toHaveURL(/market=/);
});

test("keeps mobile detail actions inside the desktop column", async ({ page }) => {
  await page.goto("/?when=all");
  await page.locator(".mobile-market-results .market-list-item").first().click();

  const detail = page.locator(".mobile-market-sheet.is-detail");
  const directions = detail.getByRole("button", { name: "길찾기 선택" });
  const share = detail.getByRole("button", { name: "공유하기" });
  await expect(directions).toBeVisible();
  await expect(share).toBeVisible();

  const directionsBox = await directions.boundingBox();
  const shareBox = await share.boundingBox();
  if (!directionsBox || !shareBox) throw new Error("Detail actions have no layout boxes");
  expect(directionsBox.x).toBeGreaterThanOrEqual(425);
  expect(directionsBox.x + directionsBox.width).toBeLessThanOrEqual(855);
  expect(shareBox.x).toBeGreaterThanOrEqual(425);
  expect(shareBox.x + shareBox.width).toBeLessThanOrEqual(855);
  expect(directionsBox.height).toBeGreaterThanOrEqual(44);
});
