# AdSense 승인 준비 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `spamfam.kr`에서 광고 요청을 완전히 제거한 채 소유권을 증명하고, 공식 출처로 편집 검수한 시장 30곳만 독립 상세·검색 색인 대상으로 제공해 AdSense 재검토 준비를 완료한다.

**Architecture:** 전역 레이아웃은 AdSense 계정 메타 태그만 렌더링하고 광고 스크립트는 렌더링하지 않는다. 원본 시장 데이터와 편집 콘텐츠를 별도 JSON으로 유지하며, 편집 콘텐츠가 검증된 30개 시장만 정적 상세 route와 sitemap에 포함한다. 나머지 시장은 홈 지도와 결과 시트에서 계속 탐색하되 독립 상세 URL 대신 홈 선택 상태 URL을 사용한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 7, Vitest 4, Testing Library, Playwright 1.63, 정적 JSON 데이터

**Spec:** `docs/superpowers/specs/2026-09-21-adsense-approval-readiness-design.md`

## Global Constraints

- 공식 canonical 도메인은 정확히 `https://spamfam.kr`이다.
- AdSense 게시자 ID는 정확히 `pub-3237088758901901`, 메타 태그 값은 `ca-pub-3237088758901901`이다.
- `ads.txt`는 `google.com, pub-3237088758901901, DIRECT, f08c47fec0942fa0` 한 줄만 포함한다.
- 승인 요청 전에는 모든 route에서 Google 광고 스크립트와 광고 iframe을 생성하지 않는다.
- 새 런타임 의존성을 추가하지 않는다.
- 기존 Next.js App Router와 Vitest/Playwright 구조를 유지한다.
- `markets.json` 생성 파이프라인과 지도·필터·제보 동작은 변경하지 않는다.
- 확인되지 않은 운영시간, 주차 요금, 대표 품목, 현장 상태를 추정하거나 자동 생성하지 않는다.
- 미검수 시장은 홈에서 계속 탐색할 수 있지만 독립 `/markets/<slug>` route를 갖지 않는다.
- 광고 비활성화가 기본값이며 이 계획에서는 승인 후 광고 단위를 구현하지 않는다.

## Review Focus

- 잘못 인코딩되거나 미검수인 market slug는 광고 없는 404를 반환하고 서버 오류를 내지 않아야 한다. Task 7의 route 테스트와 Task 11의 E2E 테스트가 검증한다.
- 시장 편집 JSON의 중복 ID, 존재하지 않는 ID, 잘못된 날짜, 비공식 프로토콜 URL은 검증 테스트에서 실패해야 한다. Task 3과 각 콘텐츠 배치 테스트가 검증한다.
- 미검수 시장을 공유하거나 새 탭으로 열 때 죽은 상세 링크가 아니라 홈 선택 상태 URL을 사용해야 한다. Task 7의 목록·공유 테스트가 검증한다.
- 레거시 호스트의 경로와 쿼리 문자열은 `spamfam.kr`로 이동할 때 보존되어야 한다. Task 2의 redirect 테스트와 Task 11의 운영 검증이 확인한다.
- 404, 제보, 개인정보, 소개, 빈 검색 결과를 포함한 비콘텐츠 화면에는 AdSense loader, `ins.adsbygoogle`, Google 광고 iframe이 없어야 한다. Task 1과 Task 11이 검증한다.

---

### Task 1: AdSense 소유권 확인과 광고 실행 분리

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/layout.test.tsx`
- Create: `apps/web/public/ads.txt`
- Create: `apps/web/src/app/adsense-readiness.test.ts`

**Interfaces:**
- Consumes: Next.js `Metadata.other`
- Produces: 전역 `google-adsense-account=ca-pub-3237088758901901`, 광고 loader가 없는 루트 HTML, 루트 `ads.txt`

- [ ] **Step 1: 전역 광고 제거와 소유권 표식을 고정하는 실패 테스트 작성**

```tsx
it("uses ownership metadata without loading AdSense ads", () => {
  expect(metadata.other?.["google-adsense-account"]).toBe("ca-pub-3237088758901901");
  const html = renderToStaticMarkup(<RootLayout>content</RootLayout>);
  expect(html).not.toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js");
});
```

`apps/web/src/app/adsense-readiness.test.ts`에는 다음 검사를 추가한다.

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

it("publishes the exact authorized seller line", () => {
  const value = readFileSync(join(process.cwd(), "public/ads.txt"), "utf8");
  expect(value).toBe("google.com, pub-3237088758901901, DIRECT, f08c47fec0942fa0\n");
});
```

- [ ] **Step 2: 테스트가 현재 전역 광고 script와 누락된 ads.txt 때문에 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/app/layout.test.tsx src/app/adsense-readiness.test.ts`

Expected: 메타 태그 또는 `ads.txt` 누락, `adsbygoogle.js` 존재로 FAIL

- [ ] **Step 3: 광고 loader를 제거하고 메타 태그와 ads.txt 추가**

`metadata`에 다음 값을 추가하고 `<head>`의 AdSense `<script>`를 삭제한다.

```ts
other: {
  "google-adsense-account": "ca-pub-3237088758901901",
},
```

`apps/web/public/ads.txt` 내용:

```text
google.com, pub-3237088758901901, DIRECT, f08c47fec0942fa0
```

- [ ] **Step 4: 광고 안전 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/app/layout.test.tsx src/app/adsense-readiness.test.ts`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/layout.test.tsx apps/web/src/app/adsense-readiness.test.ts apps/web/public/ads.txt
git commit -m "fix: separate AdSense ownership from ad loading"
```

### Task 2: canonical 도메인과 레거시 호스트 통일

**Files:**
- Modify: `apps/web/src/lib/market-seo.ts`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/src/app/seo-routes.test.ts`
- Modify: `apps/web/src/app/layout.test.tsx`
- Modify: `apps/web/src/app/page.test.tsx`

**Interfaces:**
- Consumes: 기존 `SITE_URL`, Next.js redirects, metadata
- Produces: 모든 SEO·분석 URL의 `https://spamfam.kr` 통일과 두 레거시 호스트의 영구 redirect

- [ ] **Step 1: apex 도메인과 두 redirect를 요구하는 실패 테스트 작성**

```ts
expect(SITE_URL).toBe("https://spamfam.kr");
expect(metadata.metadataBase).toEqual(new URL("https://spamfam.kr"));
expect(robots()).toEqual({
  rules: { userAgent: "*", allow: "/" },
  sitemap: "https://spamfam.kr/sitemap.xml",
  host: "https://spamfam.kr",
});
expect(redirects).toEqual(expect.arrayContaining([
  expect.objectContaining({
    has: [{ type: "host", value: "jangnal-map.vercel.app" }],
    destination: "https://spamfam.kr/:path*",
    permanent: true,
  }),
  expect.objectContaining({
    has: [{ type: "host", value: "jangnal.spamfam.kr" }],
    destination: "https://spamfam.kr/:path*",
    permanent: true,
  }),
]));
```

`layout.test.tsx`에서 Umami `data-domains`가 `spamfam.kr`인지, `page.test.tsx`에서 WebSite JSON-LD URL이 apex인지 검사한다.

- [ ] **Step 2: 도메인 테스트가 기존 subdomain 값 때문에 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/app/seo-routes.test.ts src/app/layout.test.tsx src/app/page.test.tsx`

Expected: `jangnal.spamfam.kr` 기대값 불일치로 FAIL

- [ ] **Step 3: SITE_URL, metadataBase, 분석 도메인, redirect 수정**

```ts
export const SITE_URL = "https://spamfam.kr";
```

`next.config.ts`의 redirects는 `jangnal-map.vercel.app`과 `jangnal.spamfam.kr` 각각을 동일한 apex destination으로 보낸다. Next.js의 원래 query 보존 동작을 사용하고 별도 query 조립 코드는 추가하지 않는다.

- [ ] **Step 4: 도메인 관련 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/app/seo-routes.test.ts src/app/layout.test.tsx src/app/page.test.tsx`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/src/lib/market-seo.ts apps/web/src/app/layout.tsx apps/web/next.config.ts apps/web/src/app/seo-routes.test.ts apps/web/src/app/layout.test.tsx apps/web/src/app/page.test.tsx
git commit -m "fix: converge SEO on spamfam.kr"
```

### Task 3: 시장 편집 콘텐츠 모델과 무결성 검사

**Files:**
- Create: `apps/web/public/data/market-editorial.json`
- Create: `apps/web/src/lib/market-editorial.ts`
- Create: `apps/web/src/lib/market-editorial.test.ts`

**Interfaces:**
- Consumes: `PublicMarket`, `publicMarkets`, JSON 편집 레코드
- Produces: `MarketEditorialContent`, `marketEditorialEntries`, `findMarketEditorial(marketId)`, `reviewedMarketIds`, `reviewedMarkets`

- [ ] **Step 1: 편집 레코드 검증 실패 테스트 작성**

```ts
expect(new Set(marketEditorialEntries.map((entry) => entry.marketId)).size)
  .toBe(marketEditorialEntries.length);

for (const entry of marketEditorialEntries) {
  expect(publicMarkets.some((market) => market.id === entry.marketId)).toBe(true);
  expect(entry.status).toBe("reviewed");
  expect(entry.summary.trim().length).toBeGreaterThan(0);
  expect(entry.visitTips.length).toBeGreaterThan(0);
  expect(entry.transportation.trim().length).toBeGreaterThan(0);
  expect(entry.parking.trim().length).toBeGreaterThan(0);
  expect(entry.sources.length).toBeGreaterThanOrEqual(2);
  expect(new Set(entry.sources.map((source) => source.url)).size).toBe(entry.sources.length);
  expect(entry.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  for (const nearbyId of entry.nearbyMarketIds) {
    expect(publicMarkets.some((market) => market.id === nearbyId)).toBe(true);
  }
  for (const source of entry.sources) {
    expect(new URL(source.url).protocol).toBe("https:");
    expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
}

for (const field of ["summary", "transportation", "parking"] as const) {
  const values = marketEditorialEntries.map((entry) => entry[field].trim());
  expect(new Set(values).size).toBe(values.length);
}
```

초기 빈 배열을 허용하되 잘못된 fixture를 주입한 순수 validator 테스트도 작성한다. 중복 ID, 존재하지 않는 시장 ID, `http:` 출처, 비어 있는 필수 필드, 잘못된 날짜는 각각 명시적인 오류 문자열로 실패해야 한다.

- [ ] **Step 2: 테스트가 누락된 모듈 때문에 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: module not found로 FAIL

- [ ] **Step 3: 타입과 catalog helper 구현**

```ts
export interface MarketEditorialContent {
  marketId: string;
  summary: string;
  visitTips: string[];
  transportation: string;
  parking: string;
  specialties: string[];
  nearbyMarketIds: string[];
  sources: Array<{ name: string; url: string; checkedAt: string }>;
  reviewedAt: string;
  status: "reviewed";
}

export const marketEditorialEntries = editorialData as MarketEditorialContent[];
const editorialById = new Map(marketEditorialEntries.map((entry) => [entry.marketId, entry]));
export const reviewedMarketIds = new Set(editorialById.keys());
export const reviewedMarkets = publicMarkets.filter((market) => reviewedMarketIds.has(market.id));
export const findMarketEditorial = (marketId: string) => editorialById.get(marketId);
```

`validateMarketEditorial(entries, markets)`는 테스트 가능한 순수 함수로 작성한다. JSON은 이 단계에서 `[]`로 시작한다.

- [ ] **Step 4: 빈 catalog와 validator 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/public/data/market-editorial.json apps/web/src/lib/market-editorial.ts apps/web/src/lib/market-editorial.test.ts
git commit -m "feat: add reviewed market editorial catalog"
```

### Task 4: 편집 콘텐츠 배치 A, 수도권·강원·충청 10곳

**Files:**
- Modify: `apps/web/public/data/market-editorial.json`
- Modify: `apps/web/src/lib/market-editorial.test.ts`

**Interfaces:**
- Consumes: Task 3의 JSON schema와 validator
- Produces: 아래 10개 `status: "reviewed"` 레코드

대상 시장:

1. `market-46dd8e03711ba7b6` 북평민속시장
2. `market-c3983f871839ecc8` 속초종합중앙시장
3. `market-389b4a24f06ccd11` 용인중앙시장
4. `market-d8d1a37e4d63609b` 광명전통시장
5. `market-f9785614947c1065` 광장시장
6. `market-5207a19f315d3216` 경동시장
7. `market-a977f620b61db85b` 소래포구전통어시장
8. `market-a096b1a38138db75` 세종전통시장
9. `market-46fa9022c9bff08d` 공주산성시장
10. `market-a3999c03b9b3e221` 충주자유시장

- [ ] **Step 1: 정확한 ID 집합을 요구하는 실패 테스트 추가**

```ts
expect(marketEditorialEntries.map((entry) => entry.marketId)).toEqual(expect.arrayContaining([
  "market-46dd8e03711ba7b6",
  "market-c3983f871839ecc8",
  "market-389b4a24f06ccd11",
  "market-d8d1a37e4d63609b",
  "market-f9785614947c1065",
  "market-5207a19f315d3216",
  "market-a977f620b61db85b",
  "market-a096b1a38138db75",
  "market-46fa9022c9bff08d",
  "market-a3999c03b9b3e221",
]));
expect(marketEditorialEntries).toHaveLength(10);
```

- [ ] **Step 2: 10개 레코드가 없어서 테스트가 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: expected length 10, received 0으로 FAIL

- [ ] **Step 3: 공식 출처 조사 후 배치 A 레코드 작성**

각 시장마다 현재 `markets.json` 출처에 더해 지방자치단체, 공공기관, 시장 공식 사이트 중 하나 이상의 독립적인 HTTPS 출처를 확인한다. 출처에서 확인되지 않은 사실은 쓰지 않는다. Task 3의 `MarketEditorialContent` 필드를 모두 채운다. 첫 번째 source에는 `전국전통시장표준데이터`와 `https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y`를 기록하고, 두 번째 이후 source에는 실제로 확인한 공식 기관명·HTTPS URL·확인일을 기록한다. `reviewedAt`은 편집 검수를 마친 실제 날짜다. 10개 레코드 사이에 동일한 `summary`, `transportation`, `parking` 문장을 복사하지 않는다.

- [ ] **Step 4: 배치 A 무결성 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: PASS, 10 records

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/public/data/market-editorial.json apps/web/src/lib/market-editorial.test.ts
git commit -m "content: review first AdSense market batch"
```

### Task 5: 편집 콘텐츠 배치 B, 영남·호남 10곳

**Files:**
- Modify: `apps/web/public/data/market-editorial.json`
- Modify: `apps/web/src/lib/market-editorial.test.ts`

**Interfaces:**
- Consumes: Task 4의 10개 레코드
- Produces: 누적 20개 검수 레코드

대상 시장:

1. `market-7bee231bddce4e22` 마산어시장
2. `market-57efa2a61ea8b011` 통영중앙전통시장
3. `market-54abc96559102d3e` 경주성동공설시장
4. `market-989da9eee01d8dda` 중앙신시장
5. `market-863a810b24632a10` 서문시장2지구종합상가
6. `market-1d91da2272ddf46a` 칠성시장
7. `market-a88b6fad98af479e` 여수서시장주변시장
8. `market-5f7c435508d5a3b5` 나주목사고을시장
9. `market-df4d34f3be577ba5` 전주남부시장
10. `market-a8530c90ef5bf06a` 대인시장

- [ ] **Step 1: 배치 B ID와 누적 20개를 요구하는 실패 테스트 추가**

Task 4와 같은 exact ID assertion을 위 10개 ID로 추가하고 `expect(marketEditorialEntries).toHaveLength(20)`을 설정한다.

- [ ] **Step 2: 테스트가 누적 개수 10으로 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: expected 20, received 10으로 FAIL

- [ ] **Step 3: 공식 출처 조사 후 배치 B 레코드 작성**

Task 4와 동일한 schema와 두 개 이상의 HTTPS 출처 기준을 적용한다. 시장 이름이 비슷한 경우 주소와 시장 ID를 출처의 대상과 대조한다. `nearbyMarketIds`에는 이 계획의 검수 집합에 포함된 실제 인근 시장 ID만 넣는다.

- [ ] **Step 4: 누적 20개 무결성 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: PASS, 20 records

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/public/data/market-editorial.json apps/web/src/lib/market-editorial.test.ts
git commit -m "content: review second AdSense market batch"
```

### Task 6: 편집 콘텐츠 배치 C, 광역시·제주 10곳

**Files:**
- Modify: `apps/web/public/data/market-editorial.json`
- Modify: `apps/web/src/lib/market-editorial.test.ts`

**Interfaces:**
- Consumes: Task 5의 20개 레코드
- Produces: 최종 30개 검수 레코드와 고정된 ID 집합

대상 시장:

1. `market-263aa2113b292a27` 양동복개상가
2. `market-8a0a187a44eb648a` 도마큰시장
3. `market-67f0b7c541707a6c` 한민시장
4. `market-ac45198fd61b05ce` 부산진시장
5. `market-2279d714eda1634a` 정이있는구포시장
6. `market-8151f0a3f713aa4d` 남창옹기종기시장
7. `market-2190eaf44c48bbd8` 제주시민속오일시장
8. `market-2adc6a0bdfc73a7b` 서귀포향토오일시장
9. `market-0b1ee7b765707fb2` 온양온천시장(온양전통시장)
10. `market-00f8629bf12716ac` 음성시장

- [ ] **Step 1: 배치 C ID, 누적 30개, 17개 시·도 분포 실패 테스트 추가**

```ts
expect(marketEditorialEntries).toHaveLength(30);
const reviewedRegions = new Set(reviewedMarkets.map((market) =>
  (market.roadAddress ?? market.lotAddress ?? "").split(/\s+/)[0],
));
expect(reviewedRegions.size).toBe(17);
```

Set 검사에는 `expect(reviewedRegions.size).toBe(17)`을 사용한다.

- [ ] **Step 2: 테스트가 누적 개수 20으로 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: expected 30, received 20으로 FAIL

- [ ] **Step 3: 공식 출처 조사 후 배치 C 레코드 작성**

Task 4의 schema, 출처, 중복 방지 규칙을 적용한다. 제주 오일장과 정기시장은 장날 패턴을 원본 데이터와 공식 출처 양쪽에서 대조한다. 공식 출처가 원본 데이터와 충돌하면 JSON을 추정으로 맞추지 말고 원본 데이터 오류를 별도 발견사항으로 보고한 뒤 해당 지역의 다음 후보로 교체한다.

- [ ] **Step 4: 최종 30개 catalog 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-editorial.test.ts`

Expected: PASS, 30 records, 17 regions

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/public/data/market-editorial.json apps/web/src/lib/market-editorial.test.ts
git commit -m "content: complete reviewed market catalog"
```

### Task 7: 검수 시장만 독립 route로 제공하고 공유 fallback 유지

**Files:**
- Modify: `apps/web/src/lib/market-path.ts`
- Modify: `apps/web/src/lib/market-seo.ts`
- Modify: `apps/web/src/lib/market-seo.test.ts`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`
- Modify: `apps/web/src/app/sitemap.ts`
- Modify: `apps/web/src/app/seo-routes.test.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/market-list.tsx`
- Modify: `apps/web/src/components/market-list.test.tsx`
- Modify: `apps/web/src/components/market-detail.tsx`
- Modify: `apps/web/src/components/market-detail.test.tsx`
- Modify: `apps/web/src/components/market-share-button.tsx`
- Modify: `apps/web/src/components/market-share-button.test.tsx`

**Interfaces:**
- Consumes: `reviewedMarketIds`, `reviewedMarkets`, `findMarketEditorial`
- Produces: `getMarketBrowsePath(market, reviewed)`, 30개 static params, 미검수 404, 홈 선택 URL 공유

- [ ] **Step 1: route 수, 미검수 fallback, sitemap 수를 고정하는 실패 테스트 작성**

```ts
expect(await generateStaticParams()).toHaveLength(30);
expect(sitemap()).toHaveLength(32); // home + onnuri + 30 markets
expect(getMarketBrowsePath(reviewedMarket, true)).toBe(getMarketPagePath(reviewedMarket));
expect(getMarketBrowsePath(unreviewedMarket, false)).toBe(`/?when=all&market=${encodeURIComponent(unreviewedMarket.id)}`);
```

시장 page 테스트에서 미검수 market은 `notFound()`를 호출하고, 잘못 인코딩된 slug도 같은 결과인지 검사한다. `MarketList`와 `MarketShareButton` 테스트에는 reviewed ID가 없는 시장이 홈 선택 URL을 href·공유 URL로 사용하는 사례를 추가한다.

- [ ] **Step 2: 기존 1,393개 static params와 모든 상세 링크 때문에 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-seo.test.ts src/app/markets/'[slug]'/page.test.tsx src/app/seo-routes.test.ts src/components/market-list.test.tsx src/components/market-detail.test.tsx src/components/market-share-button.test.tsx`

Expected: 1,393 vs 30, 미검수 detail href 차이로 FAIL

- [ ] **Step 3: reviewed ID를 기준으로 route와 href 구현**

```ts
export function getMarketBrowsePath(market: PublicMarket, reviewed: boolean): string {
  return reviewed
    ? getMarketPagePath(market)
    : `/?when=all&market=${encodeURIComponent(market.id)}`;
}
```

`HomePage`는 `reviewedMarketIds={[...reviewedMarketIds]}`를 `MarketExplorer`에 전달한다. Explorer는 Set으로 바꿔 `MarketList`, `MarketDetail`, `MarketShareButton`에 reviewed 여부 또는 계산된 href를 전달한다. 함수 prop을 서버에서 클라이언트로 전달하지 않는다.

`MarketPage`와 metadata는 market과 editorial이 모두 있을 때만 정상 렌더링한다. `generateStaticParams()`는 `reviewedMarkets`만 사용한다. `findRelatedMarkets`도 검수 시장만 반환한다. 이 단계의 sitemap은 home, `/onnuri`, reviewed markets만 포함하며 `/about`은 Task 9에서 페이지와 함께 추가한다.

- [ ] **Step 4: route·href·sitemap 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-seo.test.ts src/app/markets/'[slug]'/page.test.tsx src/app/seo-routes.test.ts src/components/market-list.test.tsx src/components/market-detail.test.tsx src/components/market-share-button.test.tsx`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/src/lib/market-path.ts apps/web/src/lib/market-seo.ts apps/web/src/lib/market-seo.test.ts apps/web/src/app/markets/'[slug]'/page.tsx apps/web/src/app/markets/'[slug]'/page.test.tsx apps/web/src/app/sitemap.ts apps/web/src/app/seo-routes.test.ts apps/web/src/app/page.tsx apps/web/src/components/market-explorer.tsx apps/web/src/components/market-list.tsx apps/web/src/components/market-list.test.tsx apps/web/src/components/market-detail.tsx apps/web/src/components/market-detail.test.tsx apps/web/src/components/market-share-button.tsx apps/web/src/components/market-share-button.test.tsx
git commit -m "feat: limit market routes to reviewed guides"
```

### Task 8: 검수 상세 콘텐츠와 홈 가이드 영역 렌더링

**Files:**
- Create: `apps/web/src/components/market-editorial-sections.tsx`
- Create: `apps/web/src/components/market-editorial-sections.test.tsx`
- Create: `apps/web/src/components/reviewed-market-guides.tsx`
- Create: `apps/web/src/components/reviewed-market-guides.test.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.module.css`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `MarketEditorialContent`, `reviewedMarkets`, `getMarketPagePath`
- Produces: `MarketEditorialSections({ editorial })`, `ReviewedMarketGuides({ guides })`

- [ ] **Step 1: 필수 편집 섹션과 30개 홈 링크 실패 테스트 작성**

```tsx
render(<MarketEditorialSections editorial={fixture} />);
expect(screen.getByRole("heading", { name: "한눈에 보는 시장 특징" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "방문 전에 알아둘 점" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "교통과 주차" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "대표 품목과 시장 특성" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "편집 출처" })).toBeInTheDocument();
```

홈 가이드 테스트는 30개 link가 각각 canonical market detail href를 갖고, 동일한 link name 중복으로 접근성이 깨지지 않는지 검사한다.

- [ ] **Step 2: 누락된 컴포넌트 때문에 테스트가 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/components/market-editorial-sections.test.tsx src/components/reviewed-market-guides.test.tsx src/app/markets/'[slug]'/page.test.tsx`

Expected: module not found 또는 heading 누락으로 FAIL

- [ ] **Step 3: 상세 편집 섹션과 홈 가이드 구현**

`MarketEditorialSections`는 summary, visitTips, transportation, parking, specialties, nearby links, sources와 checkedAt을 semantic section/list로 렌더링한다. 출처는 새 창에서 열고 `rel="noreferrer"`를 사용한다.

`ReviewedMarketGuides`는 30개 시장을 지역명·시장명·장날 패턴과 함께 가로 스크롤 가능한 링크 목록으로 렌더링한다. `MarketExplorer`의 필터와 지도 사이에 넣고 고정 높이로 만들어 지도 핵심 동작을 유지한다. 모바일에서는 44px 이상 터치 영역과 수평 스크롤을 사용한다.

- [ ] **Step 4: 상세·홈 가이드 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/components/market-editorial-sections.test.tsx src/components/reviewed-market-guides.test.tsx src/app/markets/'[slug]'/page.test.tsx src/app/page.test.tsx`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/src/components/market-editorial-sections.tsx apps/web/src/components/market-editorial-sections.test.tsx apps/web/src/components/reviewed-market-guides.tsx apps/web/src/components/reviewed-market-guides.test.tsx apps/web/src/app/markets/'[slug]'/page.tsx apps/web/src/app/markets/'[slug]'/page.module.css apps/web/src/app/markets/'[slug]'/page.test.tsx apps/web/src/app/page.tsx apps/web/src/components/market-explorer.tsx apps/web/src/app/globals.css apps/web/src/app/page.test.tsx
git commit -m "feat: publish reviewed market guides"
```

### Task 9: 공통 신뢰 푸터, 소개, 개인정보 연결

**Files:**
- Create: `apps/web/src/components/site-footer.tsx`
- Create: `apps/web/src/components/site-footer.module.css`
- Create: `apps/web/src/components/site-footer.test.tsx`
- Create: `apps/web/src/app/about/page.tsx`
- Create: `apps/web/src/app/about/page.module.css`
- Create: `apps/web/src/app/about/page.test.tsx`
- Modify: `apps/web/src/components/mobile-menu.tsx`
- Modify: `apps/web/src/components/mobile-app-bar.test.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/onnuri/page.tsx`
- Modify: `apps/web/src/app/privacy/page.tsx`
- Modify: `apps/web/src/app/privacy/page.test.tsx`
- Modify: `apps/web/src/app/report/page.tsx`
- Modify: `apps/web/src/app/sitemap.ts`
- Modify: `apps/web/src/app/seo-routes.test.ts`

**Interfaces:**
- Consumes: 기존 주요 route와 데이터 출처 설명
- Produces: `SiteFooter`, `/about`, 모든 주요 화면의 신뢰 링크

- [ ] **Step 1: 푸터 링크, 소개 내용, Google 데이터 사용 링크 실패 테스트 작성**

```tsx
render(<SiteFooter />);
expect(screen.getByRole("link", { name: "서비스 소개" })).toHaveAttribute("href", "/about");
expect(screen.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute("href", "/privacy");
expect(screen.getByRole("link", { name: "데이터 출처와 편집 기준" })).toHaveAttribute("href", "/about#data-policy");
expect(screen.getByRole("link", { name: "정보 수정 제보" })).toHaveAttribute("href", "/report?kind=service");
```

About 테스트는 서비스 목적, `오늘 장날 운영자`, 데이터 갱신 방식, 편집 원칙, 오류 제보 heading을 검사한다. Privacy 테스트는 `https://policies.google.com/technologies/partner-sites?hl=ko` 링크를 검사한다.

SEO route 테스트는 `/about`이 추가된 최종 sitemap 길이 33과 `https://spamfam.kr/about` 항목을 검사한다.

- [ ] **Step 2: 신규 컴포넌트와 페이지가 없어 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/components/site-footer.test.tsx src/app/about/page.test.tsx src/app/privacy/page.test.tsx src/components/mobile-app-bar.test.tsx src/app/seo-routes.test.ts`

Expected: module not found 또는 link 누락으로 FAIL

- [ ] **Step 3: SiteFooter와 About 구현, 주요 route에 연결**

`SiteFooter`는 위 네 링크를 항상 같은 순서로 렌더링한다. 홈의 fullscreen 구조에서는 explorer grid 아래의 고정 높이 trust bar로 렌더링하고, 모바일 메뉴에도 `서비스 소개` 링크를 추가해 viewport 크기와 관계없이 접근할 수 있게 한다. 시장 상세, 온누리, 개인정보, 제보, 소개 페이지에서는 main 뒤에 일반 문서 footer로 렌더링한다.

`/about`은 임의의 개인·사업자 정보를 만들지 않고 운영 주체를 `오늘 장날 운영자`로 표시한다. `#data-policy` section에 공공데이터포털 시장 데이터, 온누리 집계, 출처 확인일, 수정 제보 절차를 설명한다.

- [ ] **Step 4: 신뢰 페이지와 푸터 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/components/site-footer.test.tsx src/app/about/page.test.tsx src/app/privacy/page.test.tsx src/components/mobile-app-bar.test.tsx src/app/report/page.test.tsx src/app/markets/'[slug]'/page.test.tsx src/app/onnuri/page.test.tsx src/app/seo-routes.test.ts`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/src/components/site-footer.tsx apps/web/src/components/site-footer.module.css apps/web/src/components/site-footer.test.tsx apps/web/src/app/about/page.tsx apps/web/src/app/about/page.module.css apps/web/src/app/about/page.test.tsx apps/web/src/components/mobile-menu.tsx apps/web/src/components/mobile-app-bar.test.tsx apps/web/src/components/market-explorer.tsx apps/web/src/app/markets/'[slug]'/page.tsx apps/web/src/app/onnuri/page.tsx apps/web/src/app/privacy/page.tsx apps/web/src/app/privacy/page.test.tsx apps/web/src/app/report/page.tsx apps/web/src/app/sitemap.ts apps/web/src/app/seo-routes.test.ts
git commit -m "feat: add site trust navigation"
```

### Task 10: 온누리 안내를 출처 기반 허브로 보강

**Files:**
- Modify: `apps/web/src/app/onnuri/page.tsx`
- Modify: `apps/web/src/app/onnuri/page.module.css`
- Modify: `apps/web/src/app/onnuri/page.test.tsx`

**Interfaces:**
- Consumes: `reviewedMarkets`, 각 market의 `onnuri`, `getMarketPagePath`
- Produces: 공식 출처·기준일·검수 시장 링크를 갖춘 `/onnuri`

- [ ] **Step 1: 온누리 허브의 필수 정보 실패 테스트 작성**

```tsx
expect(screen.getByRole("heading", { name: "가맹점 수를 읽는 방법" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "검수된 시장에서 찾아보기" })).toBeInTheDocument();
expect(screen.getByText(/2025-07-31 기준/)).toBeInTheDocument();
expect(screen.getByRole("link", { name: "공식 온누리 가맹점 찾기" }))
  .toHaveAttribute("href", "https://www.onnuri.gift/place");
```

검수 시장 중 `onnuri !== null`인 시장만 canonical detail link로 표시되는지도 검사한다.

- [ ] **Step 2: 기존 짧은 안내에서 테스트가 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/app/onnuri/page.test.tsx`

Expected: 신규 heading과 시장 link 누락으로 FAIL

- [ ] **Step 3: 안내·기준일·갱신 방식·검수 시장 목록 구현**

디지털형과 지류형 수치의 중복 가능성, 가맹 상태 변경 가능성, 방문 전 공식 검색 재확인, 집계 출처와 기준일을 명시한다. 과장된 할인율이나 사용처를 추가하지 않는다. 검수 시장 목록은 `reviewedMarkets.filter((market) => market.onnuri !== null)`에서 만든다.

- [ ] **Step 4: 온누리 페이지 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/app/onnuri/page.test.tsx`

Expected: PASS

- [ ] **Step 5: 변경 커밋**

```bash
git add apps/web/src/app/onnuri/page.tsx apps/web/src/app/onnuri/page.module.css apps/web/src/app/onnuri/page.test.tsx
git commit -m "content: expand Onnuri usage guide"
```

### Task 11: 승인 준비 E2E, 전체 검증, 운영 체크리스트

**Files:**
- Create: `apps/web/e2e/adsense-readiness.spec.ts`
- Create: `docs/verification/adsense-readiness-2026-09-21.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tasks 1-10의 route, metadata, static files
- Produces: 자동화된 광고 부재 검증, 운영 검증 기록, 재검토 runbook

- [ ] **Step 1: 대표 route의 광고 부재와 SEO 표식을 검사하는 E2E 작성**

```ts
const paths = [
  "/",
  "/onnuri",
  "/about",
  "/privacy",
  "/report?kind=service",
  "/this-page-does-not-exist",
];

for (const path of paths) {
  await page.goto(path);
  await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute(
    "content",
    "ca-pub-3237088758901901",
  );
  await expect(page.locator('script[src*="googlesyndication"]')).toHaveCount(0);
  await expect(page.locator("ins.adsbygoogle")).toHaveCount(0);
  await expect(page.locator('iframe[src*="google"]')).toHaveCount(0);
}
```

같은 spec에서 다음을 추가한다.

- 검수 market URL은 200과 편집 heading을 반환한다.
- 미검수 market slug는 404를 반환한다.
- 미검수 market의 `/?when=all&market=<id>`는 시장 상세 시트를 연다.
- `/ads.txt`는 정확한 한 줄, `/robots.txt`는 apex sitemap, `/sitemap.xml`은 33개 URL과 subdomain 부재를 반환한다.
- 페이지 콘솔 error와 same-origin failed request가 없다.

- [ ] **Step 2: E2E를 실행해 아직 발견되는 통합 문제를 확인**

Run: `pnpm --filter @jangnal-map/web exec playwright test e2e/adsense-readiness.spec.ts`

Expected: 모든 구현이 연결되기 전에는 최소 한 assertion FAIL

- [ ] **Step 3: E2E가 드러낸 범위 내 통합 오류만 수정**

404 status, meta 위치, sitemap URL 수, 홈 선택 상태 복원, footer overflow 중 실패한 assertion의 소유 파일만 수정한다. E2E 통과를 위해 광고 script를 예외적으로 남기거나 검수하지 않은 상세 route를 다시 허용하지 않는다.

- [ ] **Step 4: 전체 자동 검증 실행**

Run: `pnpm test`

Expected: PASS

Run: `pnpm typecheck`

Expected: PASS

Run: `pnpm build`

Expected: Next.js build PASS, 생성된 market static params 30개

Run: `pnpm --filter @jangnal-map/web exec playwright test`

Expected: PASS

- [ ] **Step 5: 운영 검증 문서와 README runbook 작성**

`docs/verification/adsense-readiness-2026-09-21.md`에는 `git rev-parse HEAD`로 얻은 실제 commit, `date`로 얻은 Asia/Seoul 확인 시각, `https://spamfam.kr` 운영 URL을 기록한다. 자동 검증 네 개 명령의 실제 exit code와 광고 loader/iframe 부재, AdSense meta tag, canonical, ads.txt, robots.txt, sitemap 33 URL, 검수 market 200, 미검수 market 404, 홈 선택 URL 결과를 표로 기록한다. Search Console sitemap 제출, AdSense 소유권 확인, Auto ads 비활성화, 재검토 요청은 실제 콘솔에서 완료한 항목만 완료로 표시한다. README에는 승인 전 광고를 켜지 않는 규칙과 배포 후 확인 순서를 추가한다.

- [ ] **Step 6: 문서 변경 포함 최종 diff 검사**

Run: `git diff --check`

Expected: no output, exit 0

- [ ] **Step 7: 변경 커밋**

```bash
git add apps/web/e2e/adsense-readiness.spec.ts docs/verification/adsense-readiness-2026-09-21.md README.md
git commit -m "test: verify AdSense approval readiness"
```

## 배포 후 수동 절차

이 절차는 코드 구현과 자동 검증이 모두 통과한 뒤 실행한다.

1. `https://spamfam.kr` 배포 commit이 계획의 최종 commit과 일치하는지 확인한다.
2. 브라우저 네트워크와 DOM에서 대표 route 전체의 Google 광고 요청 부재를 확인한다.
3. `https://spamfam.kr/ads.txt`의 HTTP 200과 정확한 publisher line을 확인한다.
4. Search Console에 `https://spamfam.kr/sitemap.xml`을 제출하고 레거시 sitemap은 제거한다.
5. canonical 검사에서 `jangnal.spamfam.kr` 또는 `jangnal-map.vercel.app`이 남지 않았는지 확인한다.
6. AdSense 사이트 화면에서 메타 태그 또는 ads.txt 소유권 확인이 유지되는지 확인한다.
7. AdSense Auto ads가 꺼져 있는지 확인한다.
8. 위 결과를 검증 문서에 기록한 뒤에만 "문제를 수정했음을 확인합니다"를 선택하고 재검토를 요청한다.
9. 재검토가 진행되는 동안 광고 로딩, 검수 시장 집합, canonical, sitemap을 변경하지 않는다.
