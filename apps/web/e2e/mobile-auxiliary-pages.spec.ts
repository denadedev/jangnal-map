import { expect, test } from "@playwright/test";

test("renders market detail actions in a mobile-safe order", async ({ page }) => {
  await page.goto("/markets/용인중앙시장-389b4a24");
  await expect(page.getByRole("heading", { name: /용인중앙시장 장날 날짜/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "다음 장날" })).toBeVisible();
  await expect(page.getByRole("link", { name: "NAVER 지도에서 길찾기" })).toBeVisible();
});

test("shows the no-coordinate market without a directions action", async ({ page }) => {
  await page.goto("/?when=all&market=market-58b918874207f50d");
  const detail = page.getByRole("article", { name: /의정부청과야채시장/ });
  await expect(detail.getByText("위치 확인 필요")).toBeVisible();
  await expect(detail.getByRole("link", { name: "NAVER 지도에서 길찾기" })).toHaveCount(0);
});

test("keeps auxiliary pages readable and actionable", async ({ page }) => {
  await page.goto("/onnuri");
  await expect(page.getByRole("heading", { name: "온누리상품권 이용안내" })).toBeVisible();
  await expect(page.getByRole("link", { name: "공식 온누리 가맹점 찾기" })).toBeVisible();

  await page.goto("/report?kind=service");
  await expect(page.getByRole("heading", { name: "어떤 점이 불편했나요?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "제보 보내기" })).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "개인정보 처리 안내" })).toBeVisible();
});
