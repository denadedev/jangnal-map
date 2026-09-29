import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 850 }, isMobile: false, hasTouch: false });

test("closes desktop detail after changing markets without reopening an older market", async ({ page }) => {
  await page.goto("/?when=all");
  const results = page.locator(".list-pane .market-list-item");
  const detail = page.locator(".detail-pane .market-detail");
  await results.nth(0).click();
  const firstName = await detail.getByRole("heading", { level: 2 }).innerText();
  await results.nth(1).click();
  await expect(detail.getByRole("heading", { level: 2 })).not.toHaveText(firstName);

  await detail.getByRole("button", { name: "시장 상세 닫기" }).click();
  await expect(detail).toHaveCount(0);
  await expect(page).not.toHaveURL(/market=/);
});

test("keeps desktop directions and share actions aligned and easy to click", async ({ page }) => {
  await page.goto("/?when=all");
  await page.locator(".list-pane .market-list-item").first().click();

  const actions = page.locator(".detail-pane .detail-actions");
  const directions = actions.getByRole("button", { name: "지도·길찾기" });
  const share = actions.getByRole("button", { name: "공유하기" });
  await expect(directions).toBeVisible();
  await expect(share).toBeVisible();

  const directionsBox = await directions.boundingBox();
  const shareBox = await share.boundingBox();
  if (!directionsBox || !shareBox) throw new Error("Desktop actions have no layout boxes");
  expect(directionsBox.width).toBeGreaterThanOrEqual(140);
  expect(directionsBox.height).toBeGreaterThanOrEqual(44);
  expect(Math.abs(directionsBox.y - shareBox.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(directionsBox.height - shareBox.height)).toBeLessThanOrEqual(1);
});
