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
