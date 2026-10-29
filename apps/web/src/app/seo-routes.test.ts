import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { createCatalog } from "../lib/catalog/catalog";
import { loadJsonSnapshot } from "../lib/catalog/json-source";
import { getMarketPagePath, SITE_URL } from "../lib/market-seo";
import { metadata } from "./layout";
import robots from "./robots";
import sitemap from "./sitemap";

const { findMarketEditorial, isMarketIndexable, reviewedMarkets } = createCatalog(loadJsonSnapshot());

describe("SEO metadata routes", () => {
  it("publishes exactly every indexable market with unique canonical URLs", async () => {
    const entries = (await sitemap());
    const urls = entries.map(({ url }) => url);
    const indexableUrls = reviewedMarkets
      .filter(isMarketIndexable)
      .map((market) => `${SITE_URL}${encodeURI(getMarketPagePath(market))}`)
      .sort();

    expect(entries).toHaveLength(100);
    expect(new Set(urls)).toHaveLength(entries.length);
    const landingUrls = [
      `${SITE_URL}/jangnal`,
      ...["chungbuk", "chungnam", "gangwon", "gyeongbuk", "gyeonggi", "gyeongnam", "jeonbuk", "jeonnam"].map((slug) => `${SITE_URL}/jangnal/${slug}`),
      ...["1-6", "2-7", "3-8", "4-9", "5-10"].map((pattern) => `${SITE_URL}/jangnal/days/${pattern}`),
    ];
    expect(urls.sort()).toEqual([SITE_URL, `${SITE_URL}/about`, `${SITE_URL}/en`, `${SITE_URL}/onnuri`, `${SITE_URL}/privacy`, `${SITE_URL}/terms`, ...landingUrls, ...indexableUrls].sort());
    expect(urls).not.toContain(`${SITE_URL}${encodeURI("/markets/삽교시장-09e8d20c")}`);
    expect(urls.filter((url) => /[가-힣]/.test(url))).toEqual([]);
  });

  it("publishes the canonical home page as the highest-priority sitemap entry", async () => {
    expect((await sitemap())[0]).toEqual({
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    });
  });

  it("publishes the 온누리상품권 검색 허브", async () => {
    expect((await sitemap())).toContainEqual({
      url: `${SITE_URL}/onnuri`,
      changeFrequency: "monthly",
      priority: 0.9,
    });
  });

  it("uses durable catalog metadata for periodic and daily sitemap entries", async () => {
    const entries = (await sitemap());

    expect(entries.find(({ url }) => url === `${SITE_URL}${encodeURI("/markets/용인중앙시장-389b4a24")}`)).toMatchObject({
      lastModified: findMarketEditorial("market-389b4a24f06ccd11")?.reviewedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    expect(entries.find(({ url }) => url === `${SITE_URL}${encodeURI("/markets/광명전통시장-d8d1a37e")}`)).toMatchObject({
      lastModified: findMarketEditorial("market-d8d1a37e4d63609b")?.reviewedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  it("allows crawling and declares the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://kmarketday.com/sitemap.xml",
      host: "https://kmarketday.com",
    });
  });

  it("permanently redirects legacy hosts to the canonical domain", async () => {
    const redirects = await (nextConfig as {
      redirects?: () => Promise<unknown[]>;
    }).redirects?.();

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "spamfam.kr" }],
      destination: "https://kmarketday.com/:path*",
      permanent: true,
    });

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "jangnal-map.vercel.app" }],
      destination: "https://kmarketday.com/:path*",
      permanent: true,
    });

    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: "jangnal.spamfam.kr" }],
      destination: "https://kmarketday.com/:path*",
      permanent: true,
    });
  });

  it("defines production root metadata defaults", () => {
    expect(metadata.metadataBase).toEqual(new URL("https://kmarketday.com"));
    expect(metadata.verification?.google).toBe("iTnI4yy_bzEL-eOrfqhBfEo6VusJEs7MgkVCrZpgV_U");
    expect(metadata.verification?.other).toEqual({
      "naver-site-verification": "474ca7369654e9ba939c810a7988fdd9ae455a95",
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
