import { expect, test } from "@playwright/test";

const routes = [
  "/?when=all",
  "/markets/운천전통시장-45b640cc",
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
  const metrics = await page.evaluate(() => {
    const search = document.querySelector<HTMLInputElement>(".search-field input");
    const filters = document.querySelector<HTMLElement>(".filter-pills");
    const date = document.querySelector<HTMLInputElement>(".direct-date input");
    const filterRect = filters?.getBoundingClientRect();
    const dateFilterButtons = [...document.querySelectorAll<HTMLElement>(".filter-pill")];
    const sheetButton = document.querySelector<HTMLElement>(".mobile-market-sheet-heading button");
    const status = document.querySelector<HTMLElement>(".mobile-market-sheet-status");
    const describedBy = document.querySelector<HTMLElement>(".mobile-market-sheet")?.getAttribute("aria-describedby");
    return {
      fontSize: Number.parseFloat(search ? getComputedStyle(search).fontSize : "0"),
      filterOverflow: filters ? getComputedStyle(filters).overflowX : "",
      filterScrollable: filters ? filters.scrollWidth >= filters.clientWidth : false,
      dateInputFits: Boolean(filterRect) && dateFilterButtons.every((button) => button.getBoundingClientRect().right <= (filterRect?.right ?? 0) + 1),
      dateHeight: date?.getBoundingClientRect().height ?? 0,
      dateVisible: date ? getComputedStyle(date.closest(".direct-date") ?? date).display !== "none" : false,
      sheetButtonHeight: sheetButton?.getBoundingClientRect().height ?? 0,
      statusText: status?.textContent ?? "",
      describedByExists: Boolean(describedBy && document.getElementById(describedBy)),
    };
  });
  expect(metrics.fontSize).toBeGreaterThanOrEqual(16);
  expect(["auto", "scroll"]).toContain(metrics.filterOverflow);
  expect(metrics.filterScrollable || metrics.dateInputFits).toBe(true);
  if (metrics.dateVisible) expect(metrics.dateHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.sheetButtonHeight).toBeGreaterThanOrEqual(44);
  expect(metrics.statusText).toContain("시장 결과");
  expect(metrics.describedByExists).toBe(true);
});
