import { expect, test } from "@playwright/test";

const routes = ["/jangnal", "/jangnal/gyeongbuk", "/jangnal/days/4-9"];

for (const route of routes) {
  test(`renders without overflow or errors: ${route}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      if (request.url().startsWith("http://127.0.0.1:3100")) failedRequests.push(request.url());
    });

    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    await page.screenshot({ path: `test-results/${test.info().project.name}-${route.replace(/[^a-z0-9]+/gi, "-")}.png`, fullPage: true });
  });
}

test("selects a calendar day and opens a map link on the region page", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-14T03:00:00Z"));
  await page.goto("/jangnal/gyeongbuk");
  const calendar = page.getByRole("region", { name: /장날 달력/ });
  await calendar.getByRole("button", { name: /^10월 18일, 3·8일장/ }).click();
  await expect(calendar.getByText("10월 18일 일요일", { exact: false })).toBeVisible();

  const today = page.getByRole("region", { name: "오늘 열리는 장" });
  const mapLink = today.getByRole("link", { name: /안강공설시장/ });
  await expect(mapLink).toHaveAttribute("href", /^\/\?when=all&market=/);
});
