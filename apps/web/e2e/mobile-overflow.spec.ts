import { expect, test } from "@playwright/test";

const routes = [
  "/?when=all",
  "/markets/용인중앙시장-389b4a24",
  "/onnuri",
  "/report?kind=service",
  "/privacy",
];

for (const route of routes) {
  test(`has no horizontal overflow: ${route}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      if (request.url().startsWith("http://127.0.0.1:3100")) failedRequests.push(request.url());
    });

    await page.goto(route);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    await page.screenshot({ path: `test-results/${test.info().project.name}-${route.replace(/[^a-z0-9]+/gi, "-")}.png`, fullPage: true });
  });
}

test("keeps mobile controls readable and tappable", async ({ page }) => {
  await page.goto("/?when=all");
  await expect(page.locator(".mobile-market-results")).toBeVisible();
  const metrics = await page.evaluate(() => {
    const search = document.querySelector<HTMLElement>(".mobile-search-launch");
    const filters = document.querySelector<HTMLElement>(".filter-pills");
    const dateFilterButtons = [...document.querySelectorAll<HTMLElement>(".filter-pill")];
    const navigation = document.querySelector<HTMLElement>(".mobile-primary-nav");
    return {
      searchHeight: search?.getBoundingClientRect().height ?? 0,
      filterOverflow: filters ? getComputedStyle(filters).overflowX : "",
      chipHeights: dateFilterButtons.map((button) => button.getBoundingClientRect().height),
      navButtonHeights: [...(navigation?.querySelectorAll("button") ?? [])].map((button) => button.getBoundingClientRect().height),
    };
  });
  expect(metrics.searchHeight).toBeGreaterThanOrEqual(44);
  expect(["auto", "scroll"]).toContain(metrics.filterOverflow);
  expect(metrics.chipHeights).toHaveLength(5);
  expect(metrics.chipHeights.every((height) => height === 44)).toBe(true);
  expect(metrics.navButtonHeights.every((height) => height >= 44)).toBe(true);

  await page.getByRole("navigation", { name: "주요 화면" }).getByRole("button", { name: "검색" }).click();
  await expect(page.getByRole("dialog", { name: "시장 검색" }).getByRole("searchbox")).toHaveCSS("font-size", "16px");
});
