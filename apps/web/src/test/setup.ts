import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, vi } from "vitest";

// Extend this app's Vitest types even when pnpm hoists another workspace's version.
declare module "vitest" {
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}

expect.extend(matchers);
afterEach(() => cleanup());

// 앱은 시장 데이터를 DB에서만 읽는다. 테스트는 DB 대신 시드 JSON(data/)으로 같은 스냅샷을 만든다.
vi.mock("../lib/catalog/load", async () => {
  const { createCatalog } = await import("../lib/catalog/catalog");
  const { loadJsonSnapshot } = await import("../lib/catalog/json-source");
  const catalog = createCatalog(loadJsonSnapshot());
  return { loadCatalog: async () => catalog, refreshCatalog: async () => catalog };
});
