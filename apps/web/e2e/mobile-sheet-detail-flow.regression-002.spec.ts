import { expect, test, type Page } from "@playwright/test";

async function selectMarket(page: Page) {
  await page.goto("/?when=all");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "검색" }).click();
  const search = page.getByRole("dialog", { name: "시장 검색" });
  await search.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("평택");
  await search.getByRole("button", { name: /전체 결과 보기/ }).click();
  await page.locator(".mobile-market-results a[data-market-id]").first().click();
}

test("opens a full-screen market detail and returns to inline results", async ({ page }) => {
  await selectMarket(page);
  const detail = page.locator(".mobile-market-sheet.is-detail");
  await expect(detail).toHaveAttribute("aria-modal", "true");
  await expect(detail.getByRole("heading", { name: "시장 정보" })).toBeVisible();
  await expect(detail.getByRole("button", { name: "탐색으로 돌아가기" })).toBeVisible();

  await detail.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await expect(detail).toHaveCount(0);
  await expect(page.locator(".mobile-market-results")).toBeVisible();
  await expect(page.locator(".explorer-grid")).toHaveAttribute("data-mobile-view", "list");
  await expect(page).not.toHaveURL(/market=/);
});

test("returns to the list even when the map is unavailable", async ({ page }) => {
  await selectMarket(page);
  await page.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await expect(page.locator(".mobile-market-results")).toBeVisible();
  await expect(page.locator(".mobile-market-sheet.is-results")).toHaveCount(0);
});
