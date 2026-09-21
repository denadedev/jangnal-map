import { expect, test } from "@playwright/test";

test("finds a market through search and opens the mobile detail sheet", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("평택");
  await page.getByRole("link", { name: /통복시장/ }).first().click();
  await expect(page.getByRole("article", { name: /통복시장/ })).toContainText("다음 장날");
  await page.getByRole("button", { name: "시장 상세 닫기" }).click();
  await expect(page.getByRole("link", { name: /통복시장/ }).first()).toBeVisible();
});

test("moves the result sheet with explicit controls", async ({ page }) => {
  await page.goto("/?when=all");
  const sheet = page.locator(".mobile-market-sheet");
  await expect(sheet).toBeVisible();
  const snap = await sheet.getAttribute("data-snap");
  if (snap === "collapsed") {
    await page.getByRole("button", { name: "결과 펼치기" }).click();
    await expect(page.getByRole("button", { name: "전체 결과 보기" })).toBeVisible();
  } else if (snap === "half") {
    await page.getByRole("button", { name: "전체 결과 보기" }).click();
    await expect(page.getByRole("button", { name: "지도 보기" })).toBeVisible();
  } else {
    await page.getByRole("button", { name: "지도 보기" }).click();
    await expect(page.getByRole("button", { name: "결과 펼치기" })).toBeVisible();
  }
});
