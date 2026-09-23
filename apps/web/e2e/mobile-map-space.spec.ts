import { expect, test } from "@playwright/test";

test("keeps the collapsed result sheet compact enough for the map", async ({ page }) => {
  await page.goto("/?when=all");
  const sheet = page.locator(".mobile-market-sheet");
  await expect(sheet).toBeVisible();

  if (await sheet.getAttribute("data-snap") === "full") {
    await sheet.getByRole("button", { name: "지도 보기" }).click();
  }

  await expect(sheet).toHaveAttribute("data-snap", "collapsed");
  await expect.poll(() => sheet.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(112);
  await expect(sheet.locator(".mobile-market-sheet-content")).toBeHidden();
});

test("hides mobile visit guides until opened", async ({ page }) => {
  await page.goto("/?when=all");
  const guides = page.locator(".reviewed-market-guides");
  const toggle = guides.getByRole("button", { name: /시장별 방문 정보/ });

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(guides.locator("a").first()).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(guides.locator("a").first()).toBeVisible();
});
