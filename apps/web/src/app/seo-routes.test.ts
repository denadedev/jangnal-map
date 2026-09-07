import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
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

    expect(entries).toHaveLength(1_392);
    expect(new Set(urls)).toHaveLength(entries.length);
    expect(urls.sort()).toEqual([SITE_URL, ...indexableUrls].sort());
    expect(urls).not.toContain(`${SITE_URL}/markets/삽교시장-09e8d20c`);
  });

  it("publishes the canonical home page as the highest-priority sitemap entry", () => {
    expect(sitemap()[0]).toEqual({
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    });
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
      sitemap: "https://jangnal.spamfam.kr/sitemap.xml",
      host: "https://jangnal.spamfam.kr",
    });
  });

  it("permanently redirects the legacy Vercel host to the canonical domain", async () => {
    const redirects = await (nextConfig as {
      redirects?: () => Promise<unknown[]>;
    }).redirects?.();

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "jangnal-map.vercel.app" }],
      destination: "https://jangnal.spamfam.kr/:path*",
      permanent: true,
    });
  });

  it("defines production root metadata defaults", () => {
    expect(metadata.metadataBase).toEqual(new URL("https://jangnal.spamfam.kr"));
    expect(metadata.verification?.google).toEqual([
      "qLxSxOof1dITMeFrrNHReAC51FFUDTPDpCqKSpqJFgY",
      "ETYT-jUzdfgO29SuYzFjB8xuh52yLKhHF6bSi1hrjm0",
    ]);
    expect(metadata.verification?.other).toEqual({
      "naver-site-verification": "d7bf1253f88fe2410c22eb065f4af604dfccac18",
    });
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph?.url).toBe("/");
    expect(metadata.title).toEqual({
      default: "오늘 장날 | 전국 5일장·전통시장 일정 지도",
      template: "%s",
    });
    expect(metadata.description).toBe(
      "오늘·이번 주·주말에 열리는 전국 5일장과 전통시장을 지도에서 확인하세요. 시장별 장날, 주소, 주차, 전화 정보를 제공합니다.",
    );
  });
});
