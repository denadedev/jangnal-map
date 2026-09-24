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

test("keeps mobile controls in short viewports and leaves the map a clear center area", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 430, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/?when=all");

    const sheet = page.locator(".mobile-market-sheet");
    await expect(sheet).toBeVisible();
    if (await sheet.getAttribute("data-snap") === "full") {
      await sheet.getByRole("button", { name: "지도 보기" }).click();
    }
    if (await sheet.getAttribute("data-snap") === "half") {
      await sheet.getByRole("button", { name: "시트 손잡이" }).press("ArrowDown");
    }
    await expect(sheet).toHaveAttribute("data-snap", "collapsed");

    const layout = await page.evaluate(() => {
      const controls = document.querySelector(".mobile-home-controls .market-filters")?.getBoundingClientRect();
      const map = document.querySelector(".map-stage")?.getBoundingClientRect();
      const sheet = document.querySelector(".mobile-market-sheet")?.getBoundingClientRect();
      return {
        controlsTop: controls?.top ?? -1,
        controlsBottom: controls?.bottom ?? -1,
        mapBottom: map?.bottom ?? -1,
        sheetTop: sheet?.top ?? -1,
        sheetBottom: sheet?.bottom ?? -1,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        height: window.innerHeight,
      };
    });

    expect(layout.controlsTop).toBeGreaterThanOrEqual(0);
    expect(layout.controlsBottom).toBeLessThan(layout.sheetTop);
    expect(layout.sheetBottom).toBeLessThanOrEqual(layout.height + 1);
    expect(layout.mapBottom).toBeGreaterThan(layout.controlsBottom);
    expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
    if (viewport.width === 375 && viewport.height === 667) {
      expect(layout.sheetTop - layout.controlsBottom).toBeGreaterThanOrEqual(viewport.height * 0.6);
    }
  }
});

test("hides mobile visit guides until opened", async ({ page }) => {
  await page.goto("/?when=all");
  const sheet = page.locator(".mobile-market-sheet");
  await expect(sheet).toBeVisible();
  if (await sheet.getAttribute("data-snap") === "collapsed") {
    await sheet.getByRole("button", { name: "목록 열기" }).click();
  }
  const guides = sheet.locator(".reviewed-market-guides");
  const toggle = guides.getByRole("button", { name: /시장별 방문 정보/ });

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(guides.locator("a").first()).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(guides.locator("a").first()).toBeVisible();
});
