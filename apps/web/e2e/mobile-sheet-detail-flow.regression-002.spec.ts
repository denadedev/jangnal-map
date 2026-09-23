import { expect, Page, test } from "@playwright/test";

async function selectMarket(page: Page) {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.goto("/?when=all");
  await page.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("평택");
  const sheet = page.locator(".mobile-market-sheet");
  if (await sheet.getAttribute("data-snap") === "collapsed") {
    await sheet.getByRole("button", { name: "목록 열기" }).click();
  }
  await page.locator('.mobile-market-sheet a[data-market-id]').first().click();
}

test("opens selected market detail at full height and returns to the list", async ({ page }) => {
  await selectMarket(page);

  const sheet = page.locator(".mobile-market-sheet");
  await expect(sheet).toHaveAttribute("data-snap", "full");
  await expect(page.getByRole("button", { name: "닫기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "목록으로" })).toBeVisible();

  await page.getByRole("button", { name: "목록으로" }).click();
  await expect(sheet).toHaveAttribute("data-snap", "full");
  await expect(sheet).toHaveAttribute("aria-label", /시장 결과/);
  await expect(page).not.toHaveURL(/market=/);
});

test("closes selected market detail to the map-only state", async ({ page }) => {
  await selectMarket(page);

  await page.getByRole("button", { name: "닫기" }).click();
  await expect(page.locator(".mobile-market-sheet")).toHaveAttribute("data-snap", "collapsed");
  await expect(page.getByRole("button", { name: "목록 열기" })).toBeVisible();
});
