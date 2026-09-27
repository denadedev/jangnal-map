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
