import { expect, test } from "@playwright/test";

test("keeps the date chips on one horizontal row over the map", async ({ page }) => {
  await page.goto("/");
  const chips = page.locator(".mobile-home-controls .filter-pill");
  await expect(chips).toHaveCount(5);
  const tops = await chips.evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)));
  expect(new Set(tops).size).toBe(1);
  await expect(page.locator(".mobile-home-controls .filter-pills")).toHaveCSS("overflow-x", "auto");
});

test("keeps the selected date chip visible in the horizontal strip", async ({ page }) => {
  await page.goto("/?when=all");
  await expect(page.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".mobile-home-controls .filter-pill[aria-pressed='true']")).toBeInViewport();
});

test("opens a separate search screen and returns to matching results", async ({ page }) => {
  await page.goto("/");
  await page.locator(".mobile-search-launch").click();
  const search = page.getByRole("dialog", { name: "시장 검색" });
  await expect(search).toBeVisible();
  await search.getByRole("searchbox", { name: "시장명 또는 지역 검색" }).fill("통복시장");
  await search.getByRole("button", { name: /전체 결과 보기/ }).click();
  await expect(search).toHaveCount(0);
  await expect(page.locator(".mobile-market-results").getByRole("link", { name: /통복시장/ })).toBeVisible();
  await expect(page.getByRole("group", { name: "결과 보기" }).getByRole("button", { name: "목록" })).toHaveAttribute("aria-pressed", "true");
});

test("keeps the map failure inside a card and offers a list recovery action", async ({ page }) => {
  await page.goto("/");
  const fallback = page.locator(".map-fallback");
  await expect(fallback.getByText("지도를 불러올 수 없어요")).toBeVisible();
  await fallback.getByRole("button", { name: "목록으로 계속" }).click();
  await expect(page.locator(".explorer-grid")).toHaveAttribute("data-sheet-snap", "full");
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
