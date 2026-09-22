import { expect, test } from "@playwright/test";

test("finds a market through search and opens the mobile detail sheet", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("평택");
  await page.getByRole("link", { name: /통복시장/ }).first().click();
  await expect(page.getByRole("article", { name: /통복시장/ })).toContainText("다음 장날");
  await page.getByRole("button", { name: "닫기" }).click();
  await expect(page.getByRole("link", { name: /통복시장/ }).first()).toBeVisible();
});

test("opens a reviewed market's standalone page from the detail title", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("북평민속시장");
  await page.locator(".mobile-market-sheet").getByRole("link", { name: /북평민속시장/ }).click();

  const detail = page.getByRole("article", { name: "북평민속시장 상세정보" });
  const titleLink = detail.getByRole("link", { name: "북평민속시장" });
  await expect(titleLink).toHaveAttribute("href", /\/markets\/북평민속시장-/);
  await expect(titleLink).toHaveCSS("text-decoration-line", "underline");
  const underlineColor = await titleLink.evaluate((element) => getComputedStyle(element).textDecorationColor);
  await titleLink.hover();
  await expect.poll(() => titleLink.evaluate((element) => getComputedStyle(element).textDecorationColor))
    .not.toBe(underlineColor);

  await titleLink.click();

  await expect(page.getByRole("heading", { level: 1, name: /북평민속시장/ })).toBeVisible();
  expect(decodeURIComponent(new URL(page.url()).pathname)).toMatch(/^\/markets\/북평민속시장-/);
});

test("moves the result sheet with explicit controls", async ({ page }) => {
  await page.goto("/?when=all");
  const sheet = page.locator(".mobile-market-sheet");
  await expect(sheet).toBeVisible();
  const snap = await sheet.getAttribute("data-snap");
  if (snap === "collapsed") {
    await page.getByRole("button", { name: "목록 열기" }).click();
    await expect(page.getByRole("button", { name: "목록 크게 보기" })).toBeVisible();
  } else if (snap === "half") {
    await page.getByRole("button", { name: "목록 크게 보기" }).click();
    await expect(page.getByRole("button", { name: "지도 보기" })).toBeVisible();
  } else {
    await page.getByRole("button", { name: "지도 보기" }).click();
    await expect(page.getByRole("button", { name: "목록 열기" })).toBeVisible();
  }
});

test("restores the result sheet and filters with browser Back", async ({ page }) => {
  await page.goto("/?when=all");
  const search = page.getByRole("searchbox", { name: "시장명 또는 지역 검색" });
  await search.fill("평택");
  await page.getByRole("link", { name: /통복시장/ }).first().click();
  await expect(page.getByRole("article", { name: /통복시장/ })).toBeVisible();

  await page.goBack();
  await expect(search).toHaveValue("평택");
  await expect(page.getByRole("article", { name: /통복시장/ })).toHaveCount(0);
  await expect(page.locator(".mobile-market-sheet")).toBeVisible();
});

test("returns focus to the selected result after closing detail", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("평택");
  const marketLink = page.getByRole("link", { name: /통복시장/ }).first();
  await marketLink.focus();
  await marketLink.click();
  await page.getByRole("button", { name: "닫기" }).click();
  await expect(marketLink).toBeFocused();
});

test("Escape closes an expanded detail sheet", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("link", { name: /통복시장/ }).first().click();
  await page.getByRole("button", { name: "시트 손잡이" }).press("ArrowUp");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("article", { name: /통복시장/ })).toHaveCount(0);
});

test("restores a scrolled result sheet after closing detail", async ({ page }) => {
  await page.goto("/?when=all");
  const content = page.locator(".mobile-market-sheet-content");
  await expect(content).toBeVisible();
  await content.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  const before = await content.evaluate((element) => element.scrollTop);
  await page.getByRole("link", { name: /통복시장/ }).first().click();
  await page.getByRole("button", { name: "닫기" }).click();
  await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(before).toBeGreaterThanOrEqual(0);
});
