import { expect, test } from "@playwright/test";

test("keeps date chips reachable in one horizontal strip at narrow mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/?when=all");

  const strip = page.locator(".mobile-home-controls .filter-pills");
  await expect(page.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  await expect(strip.locator(".filter-pill")).toHaveText(["오늘", "다가오는 주말", "전체"]);
  for (const chip of await strip.locator(".filter-pill").all()) await expect(chip).toBeInViewport();
});
