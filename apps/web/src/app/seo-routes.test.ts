import { describe, expect, it } from "vitest";

import { publicMarkets } from "../lib/market-catalog";
import { getMarketPagePath, isMarketIndexable, SITE_URL } from "../lib/market-seo";
import { metadata } from "./layout";
import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO metadata routes", () => {
  it("publishes exactly every indexable market with unique canonical URLs", () => {
    const entries = sitemap();
    const urls = entries.map(({ url }) => url);
    const indexableUrls = publicMarkets
      .filter(isMarketIndexable)
      .map((market) => `${SITE_URL}${getMarketPagePath(market)}`)
      .sort();

    expect(entries).toHaveLength(1_391);
    expect(new Set(urls)).toHaveLength(entries.length);
    expect(urls.sort()).toEqual(indexableUrls);
    expect(urls).not.toContain(`${SITE_URL}/markets/삽교시장-09e8d20c`);
  });

  it("uses durable catalog metadata for periodic and daily sitemap entries", () => {
    const entries = sitemap();

    expect(entries.find(({ url }) => url === `${SITE_URL}/markets/운천전통시장-45b640cc`)).toMatchObject({
      lastModified: "2025-11-10",
      changeFrequency: "monthly",
      priority: 0.8,
    });
    expect(entries.find(({ url }) => url === `${SITE_URL}/markets/성정시장-da2941e1`)).toMatchObject({
      lastModified: "2025-11-10",
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  it("allows crawling and declares the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://jangnal-map.vercel.app/sitemap.xml",
      host: "https://jangnal-map.vercel.app",
    });
  });

  it("defines production root metadata defaults", () => {
    expect(metadata.metadataBase).toEqual(new URL(SITE_URL));
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe("/");
    expect(metadata.title).toEqual({
      default: "오늘 장날 · 전국 전통시장 장날 지도",
      template: "%s",
    });
  });
});
