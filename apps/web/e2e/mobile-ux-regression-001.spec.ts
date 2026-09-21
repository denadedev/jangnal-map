import { expect, test } from "@playwright/test";

test("keeps every date filter chip visible at the narrow mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/?when=all");

  const metrics = await page.evaluate(() => {
    const pills = document.querySelector<HTMLElement>(".filter-pills");
    const dateInput = document.querySelector<HTMLElement>(".direct-date");
    const dateSelection = [...document.querySelectorAll<HTMLElement>(".filter-pill")]
      .find((element) => element.textContent?.trim() === "날짜 선택");
    const pillsRect = pills?.getBoundingClientRect();
    const dateSelectionRect = dateSelection?.getBoundingClientRect();
    return {
      dateInputDisplay: dateInput ? getComputedStyle(dateInput).display : "",
      dateInputWidth: dateInput?.getBoundingClientRect().width ?? 0,
      dateSelectionRight: dateSelectionRect?.right ?? 0,
      pillsRight: pillsRect?.right ?? 0,
    };
  });

  expect(metrics.dateInputDisplay).toBe("none");
  expect(metrics.dateInputWidth).toBe(0);
  expect(metrics.dateSelectionRight).toBeLessThanOrEqual(metrics.pillsRight + 1);
});
