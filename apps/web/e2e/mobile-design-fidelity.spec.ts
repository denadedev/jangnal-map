import { expect, test } from "@playwright/test";

test("places the mobile map and market list in one scrolling page", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".map-stage");
  const results = page.locator(".mobile-market-results");
  await expect(map).toBeVisible();
  await expect(results).toBeVisible();
  await expect(page.locator(".mobile-market-sheet.is-results")).toHaveCount(0);
  const mapBox = await map.boundingBox();
  const resultsBox = await results.boundingBox();
  if (!mapBox || !resultsBox) throw new Error("Mobile map or results have no layout box");
  expect(resultsBox.y).toBeGreaterThanOrEqual(mapBox.y + mapBox.height);

  const navigation = page.getByRole("navigation", { name: "주요 화면" });
  await navigation.getByRole("button", { name: "목록" }).click();
  await expect(map).toBeHidden();
  await expect(results).toBeVisible();
  await navigation.getByRole("button", { name: "지도" }).click();
  await expect(map).toBeVisible();
});

test("uses icon navigation and even date chips at mobile widths", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "주요 화면" });
  for (const label of ["지도", "목록", "검색"]) {
    await expect(navigation.getByRole("button", { name: label }).locator("svg")).toBeVisible();
  }
  await expect(navigation.getByRole("button", { name: "지도" })).toHaveAttribute("aria-current", "page");

  const chips = page.locator(".mobile-home-controls .filter-pill");
  await expect(chips).toHaveCount(5);
  for (const chip of await chips.all()) {
    await expect(chip).toHaveCSS("height", "44px");
    await expect(chip).toHaveCSS("font-size", "13px");
    await expect(chip).toHaveCSS("padding-left", "15px");
    await expect(chip).toHaveCSS("padding-right", "15px");
  }
});

test("keeps the selected date chip visible in the horizontal strip", async ({ page }) => {
  await page.goto("/?when=all");
  await expect(page.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".mobile-home-controls .filter-pill[aria-pressed='true']")).toBeInViewport();
});

test("opens a separate search screen and returns to matching results", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "검색" }).click();
  const search = page.getByRole("dialog", { name: "시장 검색" });
  await expect(search).toBeVisible();
  await search.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("통복시장");
  await search.getByRole("button", { name: /전체 결과 보기/ }).click();
  await expect(search).toHaveCount(0);
  await expect(page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "목록" })).toHaveAttribute("aria-current", "page");
});

test("keeps the map failure inside a card and offers a list recovery action", async ({ page }) => {
  await page.goto("/");
  const fallback = page.locator(".map-fallback");
  await expect(fallback.getByText("지도를 불러올 수 없어요")).toBeVisible();
  await fallback.getByRole("button", { name: "목록으로 계속" }).click();
  await expect(page.locator(".map-stage")).toBeHidden();
  await expect(page.locator(".mobile-market-results")).toBeVisible();
});

test("chooses a visit date in the full-screen detail calendar", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-29T03:00:00.000Z") });
  await page.goto("/?when=date&date=2026-09-30&market=market-1181d511e9973d14");
  const detail = page.getByRole("dialog", { name: /통복시장 상세/ });
  await detail.getByRole("button", { name: "방문 날짜 바꾸기" }).click();
  const picker = page.getByRole("dialog", { name: "방문 날짜 선택" });
  await picker.getByRole("button", { name: "다음 달" }).click();
  await picker.getByRole("button", { name: "2026년 10월 5일" }).click();
  await picker.getByRole("button", { name: "이 날짜 적용" }).click();
  await expect(picker).toHaveCount(0);
  await expect(detail.getByRole("region", { name: "선택한 방문 날짜" })).toContainText("2026년 10월 5일");
  await expect(page).toHaveURL(/date=2026-10-05/);
  await expect(detail.getByRole("button", { name: "길찾기 선택" })).toBeVisible();
});
