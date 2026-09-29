import { expect, test } from "@playwright/test";

test("keeps date chips reachable in one horizontal strip at narrow mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/?when=all");

  const strip = page.locator(".mobile-home-controls .filter-pills");
  await expect(page.getByRole("button", { name: "전체" })).toHaveAttribute("aria-pressed", "true");
  await expect(strip.locator('.filter-pill[aria-pressed="true"]')).toBeInViewport();
  expect(await strip.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  const dateSelection = strip.getByRole("button", { name: "날짜 선택" });
  await dateSelection.scrollIntoViewIfNeeded();
  await expect(dateSelection).toBeInViewport();
  await expect(dateSelection).toHaveCSS("height", "44px");
  expect(await page.locator(".mobile-home-controls .direct-date").evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
});
