import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO metadata routes", () => {
  it("publishes every indexable market with unique canonical URLs", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(1_391);
    expect(new Set(entries.map(({ url }) => url))).toHaveLength(entries.length);
    expect(entries.every(({ url }) => url.startsWith("https://jangnal-map.vercel.app/markets/"))).toBe(true);
  });

  it("allows crawling and declares the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://jangnal-map.vercel.app/sitemap.xml",
      host: "https://jangnal-map.vercel.app",
    });
  });
});
