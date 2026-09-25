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
    command: "mkdir -p .next/standalone/apps/web/.next/static && cp -R .next/static/. .next/standalone/apps/web/.next/static/ && cd .next/standalone/apps/web && HOSTNAME=127.0.0.1 PORT=3100 node server.js",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
