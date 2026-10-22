import { describe, expect, it } from "vitest";

import { parseMarketSetLink } from "./market-set";

const parse = (search: string) => parseMarketSetLink(new URLSearchParams(search));

describe("parseMarketSetLink", () => {
  it("reads market ids and the utm source", () => {
    expect(parse("markets=a,b,c&utm_source=threads")).toEqual({ ids: ["a", "b", "c"], source: "threads" });
  });

  it("returns null without market ids", () => {
    expect(parse("utm_source=threads")).toBeNull();
    expect(parse("markets=, ,")).toBeNull();
  });

  it("drops duplicates and keeps at most ten ids", () => {
    const ids = Array.from({ length: 12 }, (_, index) => `m${index}`);
    expect(parse("markets=a,a,b")?.ids).toEqual(["a", "b"]);
    expect(parse(`markets=${ids.join(",")}`)?.ids).toHaveLength(10);
  });

  it("falls back to direct when there is no utm source", () => {
    expect(parse("markets=a")?.source).toBe("direct");
  });
});
