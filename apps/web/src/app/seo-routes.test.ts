import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { publicMarkets } from "../lib/market-catalog";
import { reviewedMarkets } from "../lib/market-editorial";
import { getMarketPagePath, isMarketIndexable, SITE_URL } from "../lib/market-seo";
import { metadata } from "./layout";
import robots from "./robots";
import sitemap from "./sitemap";

describe("SEO metadata routes", () => {
  it("publishes exactly every indexable market with unique canonical URLs", () => {
    const entries = sitemap();
    const urls = entries.map(({ url }) => url);
    const indexableUrls = reviewedMarkets
      .filter(isMarketIndexable)
      .map((market) => `${SITE_URL}${getMarketPagePath(market)}`)
      .sort();

    expect(entries).toHaveLength(33);
    expect(new Set(urls)).toHaveLength(entries.length);
    expect(urls.sort()).toEqual([SITE_URL, `${SITE_URL}/about`, `${SITE_URL}/onnuri`, ...indexableUrls].sort());
    expect(urls).not.toContain(`${SITE_URL}/markets/삽교시장-09e8d20c`);
  });

  it("publishes the canonical home page as the highest-priority sitemap entry", () => {
    expect(sitemap()[0]).toEqual({
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    });
  });

  it("publishes the 온누리상품권 검색 허브", () => {
    expect(sitemap()).toContainEqual({
      url: `${SITE_URL}/onnuri`,
      changeFrequency: "monthly",
      priority: 0.9,
    });
  });

  it("uses durable catalog metadata for periodic and daily sitemap entries", () => {
    const entries = sitemap();

    expect(entries.find(({ url }) => url === `${SITE_URL}/markets/용인중앙시장-389b4a24`)).toMatchObject({
      lastModified: "2025-11-10",
      changeFrequency: "monthly",
      priority: 0.8,
    });
    expect(entries.find(({ url }) => url === `${SITE_URL}/markets/광명전통시장-d8d1a37e`)).toMatchObject({
      lastModified: "2025-11-10",
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  it("allows crawling and declares the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://spamfam.kr/sitemap.xml",
      host: "https://spamfam.kr",
    });
  });

  it("permanently redirects the legacy Vercel host to the canonical domain", async () => {
    const redirects = await (nextConfig as {
      redirects?: () => Promise<unknown[]>;
    }).redirects?.();

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "jangnal-map.vercel.app" }],
      destination: "https://spamfam.kr/:path*",
      permanent: true,
    });

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "jangnal.spamfam.kr" }],
      destination: "https://spamfam.kr/:path*",
      permanent: true,
    });
  });

  it("defines production root metadata defaults", () => {
    expect(metadata.metadataBase).toEqual(new URL("https://spamfam.kr"));
    expect(metadata.verification?.google).toEqual([
      "qLxSxOof1dITMeFrrNHReAC51FFUDTPDpCqKSpqJFgY",
      "ETYT-jUzdfgO29SuYzFjB8xuh52yLKhHF6bSi1hrjm0",
    ]);
    expect(metadata.verification?.other).toEqual({
      "naver-site-verification": [
        "d7bf1253f88fe2410c22eb065f4af604dfccac18",
        "d98fd747905c7cae55b86be4beb8dd7584935cc8",
      ],
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
