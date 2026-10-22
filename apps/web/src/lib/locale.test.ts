import { describe, expect, it } from "vitest";

import { buildExplorerPath, getMapPath } from "./locale";

describe("localized explorer URLs", () => {
  it("keeps English region, date filter, and selected market in one shareable path", () => {
    expect(buildExplorerPath("en", {
      query: "Seoul",
      mode: "weekend",
      marketId: "market-123",
    })).toBe("/en/map?q=Seoul&when=weekend&market=market-123");
  });

  it("uses the original Korean path and omits default filters", () => {
    expect(getMapPath("ko")).toBe("/");
    expect(buildExplorerPath("ko", { query: "", mode: "today", marketId: null })).toBe("/");
  });
});
