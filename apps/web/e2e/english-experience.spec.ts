import { expect, test } from "@playwright/test";

test("English guide explains why market day matters and opens the English map", async ({ page }) => {
  const response = await page.goto("/en");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Find Korean Traditional Market Days by Date" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why visit on market day?" })).toBeVisible();
  await expect(page.getByText(/many more vendors may gather/i)).toBeVisible();
  await expect(page.getByText(/permanent shops and scheduled market days/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /explore the market map/i })).toHaveCount(2);
  await expect(page.getByRole("link", { name: /explore the market map/i }).first()).toHaveAttribute("href", "/en/map");
});

test("Korean home links to the English guide", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();

  await expect(page.getByRole("link", { name: "English guide" })).toHaveAttribute("href", "/en");
});

test("sitemap advertises only the English guide", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  const xml = await response.text();

  expect(xml.match(/https:\/\/kmarketday\.com\/en<\/loc>/g) ?? []).toHaveLength(1);
  expect(xml).not.toContain("https://kmarketday.com/en/map");
});

test("English map searches Seoul and keeps the selected market in an English URL", async ({ page }) => {
  const response = await page.goto("/en/map?q=Seoul&when=all");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("searchbox", { name: "Search a region in English or a market name in Korean" })).toHaveValue("Seoul");
  await expect(page.locator('.search-field input[type="search"]')).toHaveAccessibleName("Search a region in English or a market name in Korean");
  await expect(page.getByRole("button", { name: "All markets" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Open list/ }).click();
  const firstMarket = page.locator(".mobile-market-sheet .market-list-item").first();
  await expect(firstMarket).toHaveAttribute("href", /\/en\/map\?q=Seoul&when=all&market=/);
  await expect(firstMarket.locator(".list-copy strong").first()).toHaveAttribute("lang", "ko");
  await firstMarket.click();
  await expect(page).toHaveURL(/\/en\/map\?.*market=/);
  await expect(page.locator(".mobile-market-sheet").getByRole("button", { name: "Maps & directions" })).toBeVisible();
  await page.locator(".mobile-market-sheet").getByRole("button", { name: "Maps & directions" }).click();
  await expect(page.locator(".mobile-market-sheet").getByRole("link", { name: "Google Maps — View location" })).toHaveAttribute("href", /google\.com\/maps\/search\/\?api=1&query=/);
  await expect(page.locator(".mobile-market-sheet").getByRole("button", { name: "Maps & directions" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-market-sheet").getByRole("button", { name: "Maps & directions" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".mobile-market-sheet")).toHaveClass(/is-detail/);
  await page.keyboard.press("Escape");
  await expect(page.locator(".mobile-market-sheet")).toHaveClass(/is-results/);
});

test("English pages expose distinct search metadata", async ({ page }) => {
  await page.goto("/en");
  await expect(page).toHaveTitle("Find Korean Traditional Market Days by Date");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://kmarketday.com/en");

  await page.goto("/en/map");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://kmarketday.com/en/map");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("English guide remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("/en");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Permanent markets and market days" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore the market map" }).first()).toHaveAttribute("href", "/en/map");
  await context.close();
});

test("English map explains when an old travel date is replaced", async ({ page }) => {
  await page.goto("/en/map?when=date&date=2020-01-01");

  await expect(page.getByRole("status").filter({ hasText: "The selected date has passed" })).toBeVisible();
  await expect(page).not.toHaveURL(/date=2020-01-01/);
});

test("English map explains both a replaced date and an unavailable shared market", async ({ page }) => {
  await page.goto("/en/map?q=Seoul&when=date&date=2020-01-01&market=missing-market");

  const notice = page.getByRole("status").filter({ hasText: "The selected date has passed" });
  await expect(notice).toContainText("That market is not available");
});

test("a shared English market link confirms the chosen travel date", async ({ page }) => {
  await page.goto("/en/map?q=Seoul&when=date&date=2026-10-05&market=market-c8527eb76514f0dd");

  const selectedDate = page.locator(".mobile-market-sheet").getByRole("region", { name: "Your selected travel date" });
  await expect(selectedDate).toContainText("Market day on your selected date");
  await expect(selectedDate).toContainText("Oct 5, 2026");
});

test("language switch keeps the selected English map filters", async ({ page }) => {
  await page.goto("/en/map?q=Seoul&when=all");
  await page.getByRole("button", { name: "Open menu" }).click();

  await expect(page.getByRole("link", { name: "한국어" })).toHaveAttribute("href", "/?q=Seoul&when=all");
});

test("Today advances at Korean midnight in an open English map", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-28T14:59:59.000Z") });
  await page.goto("/en/map?when=today");

  await expect(page.locator('input[type="date"]')).toHaveAttribute("min", "2026-09-28");
  await page.clock.fastForward(2_000);
  await expect(page.locator('input[type="date"]')).toHaveAttribute("min", "2026-09-29");
});

test("English guide and map fit the mobile viewport", async ({ page }) => {
  for (const path of ["/en", "/en/map?q=Seoul&when=all"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
