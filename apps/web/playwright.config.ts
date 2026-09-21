import { defineConfig } from "@playwright/test";

const mobileWidths = [320, 375, 430];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: mobileWidths.map((width) => ({
    name: `mobile-${width}`,
    use: { viewport: { width, height: 844 }, isMobile: true, hasTouch: true },
  })),
  webServer: {
    command: "pnpm --filter @jangnal-map/web exec next start -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
