# Market SEO Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a stable, indexable page for every public market while keeping exact next-market dates correct in the browser without a daily deployment.

**Architecture:** A server-only market catalog imports the existing public JSON once. A pure SEO module owns slug, canonical URL, metadata copy, and indexing rules; the dynamic market route, sitemap, and robots route all consume those functions. Static HTML contains only durable schedule facts, while a small client component calculates the exact next market date after hydration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 7, Vitest, Testing Library, Schema.org JSON-LD

**Spec:** `docs/superpowers/specs/2026-09-07-market-seo-pages-design.md`

## Global Constraints

- Generate pages for all 1,393 public markets without adding a database, API, or package.
- Use `https://jangnal-map.vercel.app` as the canonical site URL.
- Use `/markets/{normalized-market-name}-{8-character-id-suffix}` for market URLs.
- Keep exact next-market dates out of static metadata and calculate them in the browser.
- Exclude `unknown` schedules and non-operating markets from indexing and the sitemap.
- Do not express periodic market days as Schema.org weekly opening hours.
- Preserve the existing map, filters, current-location behavior, and query-string detail links.

---

### Task 1: Market Catalog and SEO Rules

**Files:**
- Create: `apps/web/src/lib/market-catalog.ts`
- Create: `apps/web/src/lib/market-seo.ts`
- Create: `apps/web/src/lib/market-seo.test.ts`

**Interfaces:**
- Consumes: `PublicMarket` from `apps/web/src/lib/market.ts`, normalized data from `apps/web/public/data/markets.json`, `formatSchedulePattern(PublicMarket): string`
- Produces: `SITE_URL`, `publicMarkets`, `createMarketSlug`, `getMarketPagePath`, `findMarketBySlug`, `isMarketIndexable`, `createMarketSeoText`

- [ ] **Step 1: Write failing tests for stable unique slugs and catalog lookup**

```ts
import { describe, expect, it } from "vitest";

import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";
import { createMarketSlug, findMarketBySlug, getMarketPagePath } from "./market-seo";

const periodicMarket: PublicMarket = {
  id: "market-389b4a24f06ccd11",
  name: "용인 중앙시장",
  marketType: "상설장+5일장",
  roadAddress: "경기도 용인시 처인구 금령로107번길 13",
  lotAddress: null,
  latitude: 37.235,
  longitude: 127.209,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: true,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  source: { name: "공공데이터포털", url: "https://www.data.go.kr/", referenceDate: "2025-11-10" },
};

describe("market SEO identity", () => {
  it("creates a readable slug with a stable ID suffix", () => {
    expect(createMarketSlug(periodicMarket)).toBe("용인-중앙시장-389b4a24");
    expect(getMarketPagePath(periodicMarket)).toBe("/markets/용인-중앙시장-389b4a24");
  });

  it("creates one unique slug for every public market and resolves it", () => {
    const slugs = publicMarkets.map(createMarketSlug);
    expect(publicMarkets).toHaveLength(1_393);
    expect(new Set(slugs)).toHaveLength(1_393);
    expect(findMarketBySlug(slugs[0])?.id).toBe(publicMarkets[0].id);
  });
});
```

- [ ] **Step 2: Run the tests and confirm the imports fail**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/lib/market-seo.test.ts`

Expected: FAIL because `market-catalog.ts` and `market-seo.ts` do not exist.

- [ ] **Step 3: Implement the typed catalog and slug lookup**

```ts
// apps/web/src/lib/market-catalog.ts
import marketData from "../../public/data/markets.json";
import type { PublicMarket } from "./market";

export const publicMarkets = marketData as unknown as PublicMarket[];
```

```ts
// apps/web/src/lib/market-seo.ts
import type { PublicMarket } from "./market";
import { publicMarkets } from "./market-catalog";

export const SITE_URL = "https://jangnal-map.vercel.app";

const normalizeSlugPart = (value: string): string => value
  .normalize("NFKC")
  .trim()
  .replace(/[^0-9A-Za-z가-힣]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLocaleLowerCase("ko-KR");

export function createMarketSlug(market: PublicMarket): string {
  const idSuffix = market.id.replace(/^market-/, "").slice(0, 8);
  return `${normalizeSlugPart(market.name)}-${idSuffix}`;
}

export function getMarketPagePath(market: PublicMarket): string {
  return `/markets/${createMarketSlug(market)}`;
}

const marketsBySlug = new Map(publicMarkets.map((market) => [createMarketSlug(market), market]));

export function findMarketBySlug(slug: string): PublicMarket | undefined {
  return marketsBySlug.get(slug);
}
```

- [ ] **Step 4: Run the slug tests and confirm they pass**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/lib/market-seo.test.ts`

Expected: PASS for readable slug, 1,393 unique values, and lookup.

- [ ] **Step 5: Add failing tests for metadata and indexing rules**

```ts
import { createMarketSeoText, isMarketIndexable } from "./market-seo";

it("uses durable schedule facts instead of an exact next date", () => {
  expect(createMarketSeoText(periodicMarket)).toEqual({
    title: "용인 중앙시장 장날 · 5·10일장 | 오늘 장날",
    description: "경기도 용인시 용인 중앙시장은 5·10일장입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.",
  });
});

it("uses daily copy for permanent markets and noindexes unknown schedules", () => {
  const daily = { ...periodicMarket, scheduleRaw: "매일", schedule: { kind: "daily" as const } };
  const unknown = { ...periodicMarket, scheduleRaw: "확인 중", schedule: { kind: "unknown" as const, raw: "확인 중" } };
  expect(createMarketSeoText(daily).title).toBe("용인 중앙시장 영업일 · 매일 운영 | 오늘 장날");
  expect(isMarketIndexable(daily)).toBe(true);
  expect(isMarketIndexable(unknown)).toBe(false);
});
```

- [ ] **Step 6: Run the metadata tests and verify the missing exports fail**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/lib/market-seo.test.ts`

Expected: FAIL because `createMarketSeoText` and `isMarketIndexable` are not implemented.

- [ ] **Step 7: Implement schedule-specific copy and indexing**

```ts
import { formatSchedulePattern } from "./market-view";

const getRegion = (market: PublicMarket): string => {
  const address = market.roadAddress ?? market.lotAddress ?? "";
  return address.split(/\s+/).slice(0, 2).join(" ");
};

export function isMarketIndexable(market: PublicMarket): boolean {
  return market.status === "운영" && market.schedule.kind !== "unknown";
}

export function createMarketSeoText(market: PublicMarket): { title: string; description: string } {
  const region = getRegion(market);
  const locationPrefix = region ? `${region} ` : "";
  if (market.schedule.kind === "digit-pair") {
    const schedule = formatSchedulePattern(market);
    return {
      title: `${market.name} 장날 · ${schedule} | 오늘 장날`,
      description: `${locationPrefix}${market.name}은 ${schedule}입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.`,
    };
  }
  if (market.schedule.kind === "daily") {
    return {
      title: `${market.name} 영업일 · 매일 운영 | 오늘 장날`,
      description: `${locationPrefix}${market.name}은 매일 운영하는 전통시장입니다. 주소와 전화, 주차 정보를 확인하고 전국 장날 지도에서 위치를 찾아보세요.`,
    };
  }
  return {
    title: `${market.name} 전통시장 정보 | 오늘 장날`,
    description: `${locationPrefix}${market.name}의 주소와 방문 정보를 확인해 보세요. 운영 일정은 확인이 필요합니다.`,
  };
}
```

- [ ] **Step 8: Run the full market SEO test file**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/lib/market-seo.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit the catalog and SEO rules**

```bash
git add apps/web/src/lib/market-catalog.ts apps/web/src/lib/market-seo.ts apps/web/src/lib/market-seo.test.ts
git commit -m "feat: add stable market SEO identities"
```

### Task 2: Client-Side Next Market Date

**Files:**
- Create: `apps/web/src/components/market-next-date.tsx`
- Create: `apps/web/src/components/market-next-date.test.tsx`

**Interfaces:**
- Consumes: `PublicMarket`, `getNextMarketDate`, `formatKoreanDate`, `getDday`, `formatSchedulePattern`
- Produces: `MarketNextDate({ market }: { market: PublicMarket })`

- [ ] **Step 1: Write a failing hydration-safe behavior test**

```tsx
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketNextDate } from "./market-next-date";

const periodicMarket: PublicMarket = {
  id: "market-389b4a24f06ccd11",
  name: "용인 중앙시장",
  marketType: "상설장+5일장",
  roadAddress: "경기도 용인시 처인구 금령로107번길 13",
  lotAddress: null,
  latitude: 37.235,
  longitude: 127.209,
  scheduleRaw: "5일+10일",
  schedule: { kind: "digit-pair", days: [5, 0] },
  phone: null,
  hasParking: true,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  source: { name: "공공데이터포털", url: "https://www.data.go.kr/", referenceDate: "2025-11-10" },
};

describe("MarketNextDate", () => {
  afterEach(() => vi.useRealTimers());

  it("replaces the durable schedule fallback with the next date from the browser clock", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 7, 12));
    render(<MarketNextDate market={periodicMarket} />);
    await act(() => vi.runAllTimersAsync());
    expect(await screen.findByText("9월 10일 목요일")).toBeInTheDocument();
    expect(screen.getByText("D-3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and confirm the component import fails**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/components/market-next-date.test.tsx`

Expected: FAIL because `MarketNextDate` does not exist.

- [ ] **Step 3: Implement a hydration-safe client component**

```tsx
"use client";

import { useEffect, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { formatKoreanDate, getDday, formatSchedulePattern } from "../lib/market-view";
import { getNextMarketDate } from "../lib/schedule";

export function MarketNextDate({ market }: { market: PublicMarket }) {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  if (market.schedule.kind === "daily") {
    return <div><p>운영 일정</p><strong>매일 운영</strong><span>오늘 운영</span></div>;
  }
  if (market.schedule.kind === "unknown") {
    return <div><p>운영 일정</p><strong>운영 일정 확인 필요</strong></div>;
  }
  const nextDate = today ? getNextMarketDate(market, today) : null;
  const dday = nextDate && today ? getDday(nextDate, today) : null;
  return (
    <div>
      <p>다음 장날</p>
      <strong>{nextDate ? formatKoreanDate(nextDate) : formatSchedulePattern(market)}</strong>
      {dday !== null ? <span>{dday === 0 ? "오늘 장날" : `D-${dday}`}</span> : null}
    </div>
  );
}
```

- [ ] **Step 4: Run the component test and confirm it passes**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/components/market-next-date.test.tsx`

Expected: PASS with `9월 10일 목요일` and `D-3`.

- [ ] **Step 5: Commit the client date component**

```bash
git add apps/web/src/components/market-next-date.tsx apps/web/src/components/market-next-date.test.tsx
git commit -m "feat: calculate SEO page market dates in browser"
```

### Task 3: Static Market Detail Route

**Files:**
- Create: `apps/web/src/app/markets/[slug]/page.tsx`
- Create: `apps/web/src/app/markets/[slug]/page.module.css`
- Create: `apps/web/src/app/markets/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: Task 1 catalog/SEO functions, Task 2 `MarketNextDate`, existing `PublicMarket`
- Produces: `generateStaticParams`, `generateMetadata`, default market page, JSON-LD `Place`

- [ ] **Step 1: Write failing route generation and metadata tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { publicMarkets } from "../../../lib/market-catalog";
import { createMarketSlug } from "../../../lib/market-seo";
import MarketPage, { generateMetadata, generateStaticParams } from "./page";

describe("market detail route", () => {
  it("prebuilds one route for every public market", async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(1_393);
    expect(new Set(params.map(({ slug }) => slug))).toHaveLength(1_393);
  });

  it("returns canonical schedule metadata without an exact date", async () => {
    const market = publicMarkets.find((item) => item.schedule.kind === "digit-pair")!;
    const slug = createMarketSlug(market);
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(metadata.title).toContain("장날");
    expect(metadata.alternates?.canonical).toBe(`/markets/${slug}`);
    expect(metadata.description).toContain("일장");
  });

  it("marks unknown schedules as noindex", async () => {
    const market = publicMarkets.find((item) => item.schedule.kind === "unknown")!;
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: createMarketSlug(market) }) });
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("renders a selected-map link for a valid market", async () => {
    const market = publicMarkets[0];
    render(await MarketPage({ params: Promise.resolve({ slug: createMarketSlug(market) }) }));
    expect(screen.getByRole("heading", { name: market.name })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전국 장날 지도에서 보기" })).toHaveAttribute(
      "href",
      `/?when=all&market=${market.id}`,
    );
  });
});
```

- [ ] **Step 2: Run the route test and verify it fails**

Run: `pnpm --filter @jangnal-map/web exec vitest run 'src/app/markets/[slug]/page.test.tsx'`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement static params and metadata**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketNextDate } from "../../../components/market-next-date";
import { publicMarkets } from "../../../lib/market-catalog";
import { createMarketSeoText, createMarketSlug, findMarketBySlug, getMarketPagePath, isMarketIndexable, SITE_URL } from "../../../lib/market-seo";
import { formatSchedulePattern } from "../../../lib/market-view";
import styles from "./page.module.css";

export const dynamicParams = false;

type MarketPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publicMarkets
    .filter((market) => market.status === "운영")
    .map((market) => ({ slug: createMarketSlug(market) }));
}

export async function generateMetadata({ params }: MarketPageProps): Promise<Metadata> {
  const market = findMarketBySlug((await params).slug);
  if (!market) return {};
  const seo = createMarketSeoText(market);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: getMarketPagePath(market) },
    robots: isMarketIndexable(market) ? undefined : { index: false, follow: true },
    openGraph: { title: seo.title, description: seo.description, url: getMarketPagePath(market), type: "website", locale: "ko_KR" },
  };
}
```

- [ ] **Step 4: Implement the static page content and safe JSON-LD**

```tsx
const formatSourceDate = (value: string | null): string => value
  ? value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3")
  : "확인일 정보 없음";

export default async function MarketPage({ params }: MarketPageProps) {
  const market = findMarketBySlug((await params).slug);
  if (!market) notFound();

const address = market.roadAddress ?? market.lotAddress ?? "주소 정보 없음";
const mapHref = `/?when=all&market=${encodeURIComponent(market.id)}`;
const directionsHref = market.latitude !== null && market.longitude !== null
  ? `https://map.naver.com/p/directions/-/${market.longitude},${market.latitude},${encodeURIComponent(market.name)}/-/car`
  : null;
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Place",
  name: market.name,
  url: `${SITE_URL}${getMarketPagePath(market)}`,
  address,
  ...(market.phone ? { telephone: market.phone } : {}),
  ...(market.latitude !== null && market.longitude !== null
    ? { geo: { "@type": "GeoCoordinates", latitude: market.latitude, longitude: market.longitude } }
    : {}),
};

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/">오늘 장날</a>
        <a href={mapHref}>전국 지도</a>
      </header>
      <main className={styles.main}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <article className={styles.article}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>{market.marketType}</p>
            <h1>{market.name}</h1>
            <span className={styles.schedule}>{formatSchedulePattern(market)}</span>
          </section>
          <section className={`${styles.section} ${styles.nextDate}`} aria-label="운영 일정">
            <MarketNextDate market={market} />
          </section>
          <section className={styles.section}>
            <h2>방문 정보</h2>
            <dl className={styles.info}>
              <div><dt>주소</dt><dd>{address}</dd></div>
              <div><dt>전화</dt><dd>{market.phone ?? "정보 없음"}</dd></div>
              <div><dt>주차</dt><dd>{market.hasParking === true ? "주차 가능" : market.hasParking === false ? "주차장 없음" : "확인 필요"}</dd></div>
            </dl>
            <div className={styles.actions}>
              <a className={styles.primary} href={mapHref}>전국 장날 지도에서 보기</a>
              {directionsHref ? <a className={styles.secondary} href={directionsHref} target="_blank" rel="noreferrer">NAVER 지도에서 길찾기</a> : null}
            </div>
          </section>
          <footer className={styles.footer}>
            <span>정보 출처</span>{" "}
            <a href={market.source.url} target="_blank" rel="noreferrer">{market.source.name}</a>
            <p>데이터 기준일 {formatSourceDate(market.referenceDate ?? market.source.referenceDate)}</p>
          </footer>
        </article>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Add responsive route styles**

```css
.page { min-height: 100dvh; background: var(--paper); color: var(--ink); }
.header { display: flex; min-height: 70px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding: 0 24px; background: var(--panel); }
.header a { font-family: Georgia, "Noto Serif KR", serif; font-size: 20px; font-weight: 800; }
.main { width: min(760px, calc(100% - 32px)); margin: 0 auto; padding: 54px 0 72px; }
.article { border: 1px solid var(--line); border-radius: 14px; background: var(--panel); box-shadow: var(--shadow); }
.hero, .section, .footer { padding: 28px 32px; }
.hero { border-bottom: 1px solid var(--soft-line); }
.eyebrow { margin: 0 0 8px; color: var(--persimmon-dark); font-size: 12px; font-weight: 800; }
.hero h1 { margin: 0; font-family: Georgia, "Noto Serif KR", serif; font-size: clamp(28px, 5vw, 42px); letter-spacing: -0.05em; }
.schedule { display: inline-flex; margin-top: 16px; border-radius: 999px; padding: 7px 11px; background: var(--persimmon-soft); color: var(--persimmon-dark); font-size: 12px; font-weight: 800; }
.section { border-bottom: 1px solid var(--soft-line); }
.section h2 { margin: 0 0 18px; font-size: 15px; }
.nextDate > div { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.nextDate p { margin: 0; color: var(--muted); font-size: 11px; }
.nextDate strong { display: block; margin-top: 6px; font-family: Georgia, "Noto Serif KR", serif; font-size: 22px; }
.nextDate span { flex: 0 0 auto; border-radius: 999px; padding: 8px 11px; background: var(--persimmon); color: white; font-size: 12px; font-weight: 800; }
.info { display: grid; gap: 12px; margin: 0; }
.info div { display: grid; grid-template-columns: 72px 1fr; gap: 12px; font-size: 13px; line-height: 1.55; }
.info dt { color: var(--muted); }
.info dd { margin: 0; font-weight: 650; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.primary, .secondary { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; border-radius: 5px; padding: 0 18px; font-size: 13px; font-weight: 800; }
.primary { background: var(--ink); color: white; }
.secondary { border: 1px solid var(--line); background: white; }
.footer { color: var(--muted); font-size: 11px; line-height: 1.6; }
.footer p { margin: 4px 0 0; }
.footer a { font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 700px) {
  .header { min-height: 59px; padding: 0 16px; }
  .main { width: min(100% - 24px, 760px); padding: 24px 0 40px; }
  .hero, .section, .footer { padding: 22px 20px; }
  .actions { flex-direction: column; }
  .primary, .secondary { width: 100%; }
}
```

- [ ] **Step 6: Run the route tests and full type check**

Run: `pnpm --filter @jangnal-map/web exec vitest run 'src/app/markets/[slug]/page.test.tsx'`

Expected: PASS.

Run: `pnpm typecheck`

Expected: PASS with Next.js 16 async route params.

- [ ] **Step 7: Commit the static detail route**

```bash
git add 'apps/web/src/app/markets/[slug]/page.tsx' 'apps/web/src/app/markets/[slug]/page.module.css' 'apps/web/src/app/markets/[slug]/page.test.tsx'
git commit -m "feat: add static market detail pages"
```

### Task 4: Sitemap, Robots, and Root Metadata

**Files:**
- Create: `apps/web/src/app/sitemap.ts`
- Create: `apps/web/src/app/robots.ts`
- Create: `apps/web/src/app/seo-routes.test.ts`
- Modify: `apps/web/src/app/layout.tsx`

**Interfaces:**
- Consumes: `SITE_URL`, `publicMarkets`, `getMarketPagePath`, `isMarketIndexable`
- Produces: Next.js metadata routes `/sitemap.xml`, `/robots.txt`, and root metadata defaults

- [ ] **Step 1: Write failing metadata-route tests**

```ts
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
```

- [ ] **Step 2: Run the test and confirm both routes are missing**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/app/seo-routes.test.ts`

Expected: FAIL because `robots.ts` and `sitemap.ts` do not exist.

- [ ] **Step 3: Implement sitemap and robots routes**

```ts
// apps/web/src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { publicMarkets } from "../lib/market-catalog";
import { getMarketPagePath, isMarketIndexable, SITE_URL } from "../lib/market-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicMarkets.filter(isMarketIndexable).map((market) => ({
    url: `${SITE_URL}${getMarketPagePath(market)}`,
    ...(market.referenceDate ? { lastModified: market.referenceDate } : {}),
    changeFrequency: "monthly",
    priority: market.schedule.kind === "digit-pair" ? 0.8 : 0.6,
  }));
}
```

```ts
// apps/web/src/app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/market-seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

- [ ] **Step 4: Expand root metadata**

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://jangnal-map.vercel.app"),
  title: { default: "오늘 장날 · 전국 전통시장 장날 지도", template: "%s" },
  description: "전국 전통시장의 오늘 장날, 5일장 일정, 주소와 방문 정보를 지도에서 찾아보세요.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "오늘 장날 · 전국 전통시장 장날 지도",
    description: "전국 전통시장의 장날과 방문 정보를 한눈에 확인하세요.",
    url: "/",
    siteName: "오늘 장날",
    locale: "ko_KR",
    type: "website",
  },
};
```

- [ ] **Step 5: Run route tests, all tests, and type checking**

Run: `pnpm --filter @jangnal-map/web exec vitest run src/app/seo-routes.test.ts`

Expected: PASS with 1,391 sitemap entries.

Run: `pnpm test && pnpm typecheck`

Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit SEO metadata routes**

```bash
git add apps/web/src/app/sitemap.ts apps/web/src/app/robots.ts apps/web/src/app/seo-routes.test.ts apps/web/src/app/layout.tsx
git commit -m "feat: publish market sitemap and metadata"
```

### Task 5: Full Static Build, Visual QA, and Deployment

**Files:**
- Verify only; modify only files implicated by a failing check.

**Interfaces:**
- Consumes: all deliverables from Tasks 1–4
- Produces: verified PR, `main` merge, Vercel Production deployment

- [ ] **Step 1: Run the complete verification suite**

Run: `pnpm test`

Expected: 26 existing data-audit tests plus all web tests PASS.

Run: `pnpm typecheck`

Expected: PASS.

Run: `pnpm build`

Expected: PASS and output includes `/markets/[slug]`, `/sitemap.xml`, and `/robots.txt`; static generation completes for 1,393 market params.

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intentional committed files.

- [ ] **Step 2: Verify representative local pages**

Run the production build on an unused local port and verify:

```text
/markets/운천전통시장-45b640cc   -> title includes 장날 and body includes 4·9일장
/markets/성정시장-da2941e1       -> title includes 영업일 and body includes 매일 운영
/markets/삽교시장-09e8d20c       -> robots meta contains noindex
/markets/not-a-market            -> 404
/sitemap.xml                     -> canonical production URLs only
/robots.txt                      -> sitemap URL and allow rule
```

At 375px and 1280px, confirm the title, schedule, address, map CTA, and directions CTA do not overflow. Confirm the browser console has no errors.

- [ ] **Step 3: Review the complete branch diff**

Run: `git diff origin/main...HEAD --stat && git diff origin/main...HEAD`

Expected: only the approved SEO design, implementation plan, SEO libraries/tests, market route/styles, metadata routes, and root metadata changes.

- [ ] **Step 4: Push and create the SEO PR**

```bash
git push -u origin codex/market-seo-pages
gh pr create --base main --head codex/market-seo-pages --title "feat: 시장별 SEO 페이지 제공" --body "## Summary
- 1,393개 시장별 정적 상세 페이지와 일정별 메타데이터 제공
- 색인 가능한 시장 사이트맵 및 robots 정책 제공
- 정확한 다음 장날은 브라우저 날짜 기준으로 계산

## Verification
- 전체 테스트, 타입 검사, 정적 빌드 통과
- 정기·상설·일정 미확인·404 대표 경로 확인
- 375px 및 1280px 레이아웃 확인"
```

The PR body must list the page count, indexable count, test/type/build results, and representative visual checks. Do not include secrets or local paths.

- [ ] **Step 5: Wait for CI, merge, and verify Vercel Production**

After PR CI passes, squash-merge to `main`. Wait for the `main` CI and Vercel Production deployment to report success. On `https://jangnal-map.vercel.app`, repeat the representative route, metadata, sitemap, robots, 404, 375px, and console checks from Step 2.

- [ ] **Step 6: Synchronize local main**

```bash
git switch main
git pull --ff-only origin main
git status --short
```

Expected: local `main` matches deployed `origin/main` and the worktree is clean.
