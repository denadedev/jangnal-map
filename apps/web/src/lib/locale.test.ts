import { describe, expect, it } from "vitest";

import { buildExplorerPath, getMapPath } from "./locale";

describe("localized explorer URLs", () => {
  it("keeps English region, date, and selected market in one shareable path", () => {
    expect(buildExplorerPath("en", {
      query: "Seoul",
      mode: "date",
      directDate: "2026-10-02",
      marketId: "market-123",
    })).toBe("/en/map?q=Seoul&when=date&date=2026-10-02&market=market-123");
  });

  it("uses the original Korean path and omits default filters", () => {
    expect(getMapPath("ko")).toBe("/");
    expect(buildExplorerPath("ko", { query: "", mode: "week", directDate: "2026-10-02", marketId: null })).toBe("/");
  });
});
