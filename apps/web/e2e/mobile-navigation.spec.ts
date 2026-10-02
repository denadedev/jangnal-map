import { expect, test, type Page } from "@playwright/test";

async function searchFor(page: Page, query: string) {
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "검색" }).click();
  const search = page.getByRole("dialog", { name: "시장 검색" });
  await search.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill(query);
  await search.getByRole("button", { name: /전체 결과 보기/ }).click();
}

test("finds a market through search and opens full-screen detail", async ({ page }) => {
  await page.goto("/?when=all");
  await searchFor(page, "평택");
  await page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first().click();
  await expect(page.getByRole("article", { name: /통복시장/ })).toContainText("다음 장날");
  await page.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await expect(page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first()).toBeVisible();
});

test("opens a reviewed market's standalone page from the detail title", async ({ page }) => {
  await page.goto("/?when=all");
  await searchFor(page, "북평민속시장");
  await page.locator(".mobile-market-results .market-list").getByRole("link", { name: /북평민속시장/ }).click();
  const detail = page.getByRole("article", { name: "북평민속시장 상세정보" });
  const titleLink = detail.getByRole("link", { name: "북평민속시장" });
  await expect(titleLink).toHaveAttribute("href", /\/markets\/북평민속시장-/);
  await titleLink.click();
  await expect(page.getByRole("heading", { level: 1, name: /북평민속시장/ })).toBeVisible();
});

test("switches map and list without covering either with a result sheet", async ({ page }) => {
  await page.goto("/?when=all");
  const navigation = page.getByRole("navigation", { name: "주요 화면" });
  await navigation.getByRole("button", { name: "목록" }).click();
  await expect(page.locator(".map-stage")).toBeHidden();
  await expect(page.locator(".mobile-market-results")).toBeVisible();
  await navigation.getByRole("button", { name: "지도" }).click();
  await expect(page.locator(".map-stage")).toBeVisible();
  await expect(page.locator(".mobile-market-sheet.is-results")).toHaveCount(0);
});

test("restores filters and the result page with browser Back", async ({ page }) => {
  await page.goto("/?when=all");
  await searchFor(page, "평택");
  await page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first().click();
  await expect(page.getByRole("article", { name: /통복시장/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("article", { name: /통복시장/ })).toHaveCount(0);
  await expect(page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first()).toBeVisible();
  await expect(page).toHaveURL(/q=/);
});

test("returns focus to the selected result after closing detail", async ({ page }) => {
  await page.goto("/?when=all");
  await searchFor(page, "평택");
  const marketLink = page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first();
  await marketLink.click();
  await page.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await expect(marketLink).toBeFocused();
});

test("Escape closes full-screen detail", async ({ page }) => {
  await page.goto("/?when=all");
  await page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first().click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("article", { name: /통복시장/ })).toHaveCount(0);
});

test("Tab reaches visible controls in full-screen detail", async ({ page }) => {
  await page.goto("/?when=all&market=market-1181d511e9973d14");
  const detail = page.getByRole("dialog", { name: /상세/ });
  await expect(detail).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(detail.getByRole("button", { name: "탐색으로 돌아가기" })).toBeFocused();
});

test("restores the result scroll position after closing detail", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "목록" }).click();
  const results = page.locator(".explorer-grid");
  const marketLink = page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ }).first();
  await marketLink.scrollIntoViewIfNeeded();
  const before = await results.evaluate((element) => element.scrollTop);
  await marketLink.click();
  await page.getByRole("button", { name: "탐색으로 돌아가기" }).click();
  await expect.poll(() => results.evaluate((element) => element.scrollTop)).toBeGreaterThanOrEqual(before);
});
