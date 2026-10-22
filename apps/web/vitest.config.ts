import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    // 화면 테스트(.tsx)만 jsdom을 띄운다. DOM이 필요한 .ts 테스트는 파일 첫 줄에 `@vitest-environment jsdom`을 적는다.
    projects: [
      { extends: true, test: { name: "dom", environment: "jsdom", include: ["src/**/*.test.tsx"] } },
      { extends: true, test: { name: "node", environment: "node", include: ["src/**/*.test.ts"] } },
    ],
  },
});
