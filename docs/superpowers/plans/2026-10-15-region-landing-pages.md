# Region Landing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시·도별(`/jangnal/{region}`), 장날 끝자리별(`/jangnal/days/{pattern}`), 전국 허브(`/jangnal`) 랜딩 페이지를 정적으로 생성해 지역·패턴 장날 검색 유입을 받는다.

**Architecture:** 순수 함수 모듈(`lib/region.ts`, `lib/jangnal-landing.ts`)이 시·도 판별, 패턴 매칭, 날짜별 묶음을 담당한다. 세 라우트는 `generateStaticParams` + `dynamicParams = false`로 빌드 시 생성하고, 날짜와 무관한 본문(시·군별 목록, 지역 소개, FAQ)만 정적 HTML에 넣는다. "오늘·이번 주말·한 달 달력"은 기존 `MarketNextDate`처럼 브라우저에서 한국 날짜로 계산하는 클라이언트 컴포넌트가 그린다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 7, Vitest, Testing Library, CSS Modules, Playwright

**Spec:** `docs/product/2026-10-14-prd-region-landing.md` 시각 디자인 = Open Design 프로젝트 "오늘 장날 모바일 UX 개선"의 `jangnal-region-landing.html`.

**PRD와 다르게 정한 것:** PRD §5.3은 ISR(하루 단위 재생성)을 제안했지만, 이 저장소는 이미 "정확한 날짜는 정적 HTML에 넣지 않고 브라우저에서 계산" 규칙을 쓰고 있다(`docs/superpowers/plans/2026-09-07-market-seo-pages.md`, `components/market-next-date.tsx`). 같은 방식을 따라 캐시·재배포 문제를 없앤다.

## Global Constraints

- 데이터베이스, API, 새 패키지를 추가하지 않는다.
- 미검수 시장에 새 독립 URL을 만들지 않는다. 미검수 시장 링크는 `getMarketBrowsePath(market, false)` (`/?when=all&market={id}`)를 쓴다.
- 장날 계산은 `getMarketDates` / `getNextMarketDate`(`lib/schedule.ts`)만 쓴다. 31일 다음 1일 휴장(`skipsFirstAfterThirtyFirst`) 규칙을 따로 구현하지 않는다.
- "오늘"은 `getKoreaCalendarDate(new Date())`(`lib/korea-date.ts`) 기준이다.
- "이번 주말"은 `getDateRange("weekend", today, "")`(`lib/market-view.ts`) 결과를 그대로 쓴다.
- 정확한 날짜(오늘, D-n, 이번 달 달력)는 정적 HTML·메타데이터에 넣지 않는다.
- 대상 시장 = `status === "운영"` 이고 `schedule.kind === "digit-pair"` 인 시장.
- 1단계 시·도 = 대상 시장 20곳 이상 **그리고** `region-editorial.json` 항목이 있는 시·도.
- URL 슬러그(영문): `gyeongbuk, gyeongnam, jeonnam, gyeonggi, chungnam, jeonbuk, chungbuk, gangwon` (나머지 9개 시·도도 슬러그는 정의하되 조건 미달이면 페이지를 만들지 않는다).
- 패턴 슬러그: `1-6, 2-7, 3-8, 4-9, 5-10`. `5-10`은 데이터의 `days` `[5, 0]`과 같다(순서 무관).
- 광고 영역은 넣지 않는다.
- 레이아웃은 기존 앱과 같이 모바일 기준, PC에서도 중앙 430px.
- Umami 이벤트는 `data-umami-event` 속성으로만 단다: `region-market-click`(`data-umami-event-reviewed="true|false"`), `region-map-open`.

## Review Focus

1. **31일이 있는 달의 1일**: 10월 31일(토) 다음 11월 1일, `skipsFirstAfterThirtyFirst` 1·6일장은 1일 달력 칸·목록에서 빠져야 한다 → Task 2 테스트로 고정.
2. **한국 밖 시간대 / 자정 직후 접속**: 브라우저 시간대가 UTC여도 한국 날짜로 "오늘"을 정해야 한다 → Task 4 테스트로 고정.
3. **오늘 열리는 장이 0곳인 시·도**: 빈 목록 대신 "다음 장날은 ○월 ○일"을 보여 준다 → Task 4 테스트로 고정.
4. **주소 오타 시·도(`전북특별차치도`)**: 전북으로 집계되어야 한다(34곳) → Task 1 테스트로 고정.
5. **없는 슬러그(`/jangnal/seoul`, `/jangnal/days/1-2`)**: 404 → Task 5·6 테스트로 고정.

---

### Task 0: 디자인 기준 파일 가져오기 (사람 작업)

- [ ] Open Design에서 `jangnal-region-landing.html`을 내보내 `docs/design/2026-10-15-region-landing.html`로 저장하고 커밋한다. 이후 모든 CSS 값(색, 간격, 글자 크기, 끝자리 5색 틴트, `--muted` 보정값)은 이 파일에서 가져온다.
- [ ] 시안의 예시 검수 시장 4곳(안강·고령대가야·황금·풍산)은 무시한다. 검수 여부는 `reviewedMarketIds`로만 정한다.

### Task 1: 시·도·시군 판별

**Files:**
- Create: `apps/web/src/lib/region.ts`
- Test: `apps/web/src/lib/region.test.ts`

**Interfaces:**
- Consumes: `PublicMarket`, `publicMarkets`
- Produces:
  - `type RegionSlug = "seoul" | "busan" | … | "jeju"` (17개)
  - `interface Region { slug: RegionSlug; name: string; shortName: string; prefixes: readonly string[] }` — 예: `{ slug: "gyeongbuk", name: "경상북도", shortName: "경북", prefixes: ["경상북도"] }`
  - `const REGIONS: readonly Region[]`
  - `getMarketRegion(market: PublicMarket): Region | null` — 주소(`roadAddress ?? lotAddress`) 첫 단어가 prefix와 같으면 그 시·도
  - `getMarketDistrict(market: PublicMarket): string` — 주소 둘째 단어(예: "경주시"), 없으면 `""`
  - `findRegionBySlug(slug: string): Region | undefined`

prefix 목록은 `lib/region-aliases.ts`의 값을 그대로 옮기고, `region-aliases.ts`가 `REGIONS`를 재사용하도록 바꾼다(영문 별칭 `names`는 `region-aliases.ts`에 남긴다).

- [ ] **Step 1: 실패하는 테스트**

```ts
it("counts operating digit-pair markets per launch region", () => {
  const counts = countByRegion(periodicMarkets); // 테스트 내부 헬퍼
  expect(counts).toMatchObject({ gyeongbuk: 79, gyeongnam: 69, jeonnam: 63, gyeonggi: 36, chungnam: 35, jeonbuk: 34, chungbuk: 31, gangwon: 23 });
});
it("assigns every operating digit-pair market to exactly one region", () => {
  expect(periodicMarkets.filter((m) => getMarketRegion(m) === null)).toEqual([]);
});
it("maps the 전북특별차치도 typo to jeonbuk", () => {
  const market = periodicMarkets.find((m) => (m.roadAddress ?? m.lotAddress ?? "").startsWith("전북특별차치도"))!;
  expect(getMarketRegion(market)?.slug).toBe("jeonbuk");
});
it("returns the district", () => { /* 안강공설시장 → "경주시" */ });
```

- [ ] **Step 2:** `pnpm --filter @jangnal-map/web test src/lib/region.test.ts` → FAIL (모듈 없음)
- [ ] **Step 3:** `region.ts` 구현, `region-aliases.ts`를 `REGIONS` 기반으로 변경
- [ ] **Step 4:** `region.test.ts`, `region-aliases.test.ts` 모두 PASS
- [ ] **Step 5:** 커밋 `feat: add region lookup for market addresses`

### Task 2: 랜딩 데이터 묶음

**Files:**
- Create: `apps/web/src/lib/jangnal-landing.ts`
- Test: `apps/web/src/lib/jangnal-landing.test.ts`

**Interfaces:**
- Consumes: Task 1 전체, `getMarketDates`, `getNextMarketDate`, `reviewedMarketIds`
- Produces:
  - `type DayPattern = "1-6" | "2-7" | "3-8" | "4-9" | "5-10"`
  - `const DAY_PATTERNS: readonly DayPattern[]`
  - `periodicMarkets: PublicMarket[]` — 운영 중 digit-pair 시장
  - `getPatternOf(market: PublicMarket): DayPattern | null`
  - `getRegionMarkets(slug: RegionSlug): PublicMarket[]`
  - `getPatternMarkets(pattern: DayPattern): PublicMarket[]`
  - `groupByDistrict(markets: PublicMarket[]): { district: string; markets: PublicMarket[] }[]` — 시·군 가나다순, 시장명 가나다순
  - `groupByRegion(markets: PublicMarket[]): { region: Region; markets: PublicMarket[] }[]` — 패턴 페이지용, `REGIONS` 순서
  - `getMarketsOpenOn(markets: PublicMarket[], date: Date): PublicMarket[]`
  - `getMonthCalendar(markets: PublicMarket[], year: number, monthIndex: number): { date: Date; pattern: DayPattern | null; count: number }[]` — 해당 월 1일~말일, `pattern`은 그날 끝자리에 해당하는 패턴
  - `getNextOpenDate(markets: PublicMarket[], from: Date): Date | null` — 목록 중 가장 이른 다음 장날
  - `isLaunchRegion(slug: RegionSlug): boolean` — 대상 시장 ≥ 20 그리고 지역 소개 있음 (Task 3의 `findRegionEditorial` 사용; Task 3 전까지는 개수 조건만 테스트)

- [ ] **Step 1: 실패하는 테스트**

```ts
it("matches 5-10 to days [5, 0] regardless of order", () => { … getPatternOf(m) === "5-10" });
it("counts patterns nationwide", () => {
  expect(DAY_PATTERNS.map((p) => getPatternMarkets(p).length)).toEqual([66, 87, 84, 87, 85]);
});
it("opens 4-9 markets in Gyeongbuk on 2026-10-14", () => {
  const open = getMarketsOpenOn(getRegionMarkets("gyeongbuk"), new Date(2026, 9, 14));
  expect(open.map(getPatternOf).every((p) => p === "4-9")).toBe(true);
  expect(open.some((m) => m.name === "안강공설시장")).toBe(true);
});
it("excludes skipsFirstAfterThirtyFirst markets on Nov 1 after Oct 31", () => {
  const skipping = periodicMarkets.find((m) => m.schedule.kind === "digit-pair" && m.schedule.skipsFirstAfterThirtyFirst)!;
  expect(getMarketsOpenOn([skipping], new Date(2026, 10, 1))).toEqual([]);
  expect(getMarketsOpenOn([skipping], new Date(2026, 9, 31))).toEqual([skipping]);
});
it("builds a 31-day October calendar whose counts match getMarketsOpenOn", () => { … });
it("groups districts in Korean order", () => { … });
```

- [ ] **Step 2:** 테스트 실행 → FAIL
- [ ] **Step 3:** 구현
- [ ] **Step 4:** PASS
- [ ] **Step 5:** 커밋 `feat: group periodic markets by region, pattern and date`

### Task 3: 지역 소개 데이터와 검증

**Files:**
- Create: `apps/web/public/data/region-editorial.json` (처음엔 `[]`)
- Create: `apps/web/src/lib/region-editorial.ts`
- Test: `apps/web/src/lib/region-editorial.test.ts`

**Interfaces:**
- Produces:
  - `interface RegionEditorialContent { regionSlug: RegionSlug; summary: string; highlights: { marketId: string; note: string }[]; visitTips: string[]; sources: MarketEditorialSource[]; reviewedAt: string; status: "reviewed" }`
  - `validateRegionEditorial(entries, markets): string[]` — `validateMarketEditorial`과 같은 형식의 오류 문자열
  - `findRegionEditorial(slug: RegionSlug): RegionEditorialContent | undefined`

검증 규칙: 슬러그 중복·미정의 금지, `summary` 비어 있지 않음, `highlights` 2~3개이고 각 `marketId`가 그 시·도의 대상 시장, `visitTips` ≥ 1, `sources` ≥ 1이고 `checkedAt`·`reviewedAt`은 `YYYY-MM-DD`.

- [ ] **Step 1:** 잘못된 항목마다 오류가 나오는 테스트 + 실제 JSON이 오류 0개라는 테스트
- [ ] **Step 2:** FAIL 확인
- [ ] **Step 3:** 구현, Task 2의 `isLaunchRegion`에 지역 소개 조건 연결
- [ ] **Step 4:** PASS (`isLaunchRegion("gyeongbuk")`는 JSON이 비어 있으므로 `false`)
- [ ] **Step 5:** 커밋 `feat: add validated region editorial data`

지역 소개 8편의 본문은 이 작업에 포함하지 않는다(→ Task 9).

### Task 4: 오늘·주말·달력 클라이언트 컴포넌트

**Files:**
- Create: `apps/web/src/components/jangnal-today.tsx`, `jangnal-today.module.css`
- Test: `apps/web/src/components/jangnal-today.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `getMarketsOpenOn`, `getMonthCalendar`, `getNextOpenDate`, `getPatternOf`
- Produces: `JangnalToday({ markets, browseHref }: { markets: MarketLink[]; browseHref: string })` — `"use client"`
  - `type MarketLink = { id: string; name: string; district: string; schedule: MarketSchedule; hasParking: boolean | null; href: string; reviewed: boolean }` — 서버 페이지가 만들어 넘긴다(클라이언트 번들에 전체 시장 JSON을 넣지 않기 위해 이 필드만)

화면: ① 오늘 열리는 장 ② 이번 주말(토·일 두 묶음) ③ 이번 달 달력(칸 = 날짜 + 개수 + 끝자리 색, 누르면 그 날 목록). 첫 렌더(하이드레이션 전)에는 세 영역 모두 자리 표시만 보여 준다.

- [ ] **Step 1: 실패하는 테스트** (`vi.useFakeTimers` + `vi.setSystemTime`)

```ts
it("uses the Korea date even when the browser clock is UTC", () => {
  vi.setSystemTime(new Date("2026-10-13T15:30:00Z")); // 한국 10/14 00:30
  render(<JangnalToday markets={fixture} browseHref="/" />);
  expect(screen.getByRole("heading", { name: /10월 14일/ })).toBeInTheDocument();
});
it("shows the next open date when nothing opens today", () => {
  // 4-9 시장만 있는 fixture, 오늘 = 10/15
  expect(screen.getByText("다음 장날은 10월 19일 월요일")).toBeInTheDocument();
});
it("lists Saturday and Sunday separately", () => { … });
it("shows the selected day's markets when a calendar cell is pressed", async () => { … });
it("marks reviewed and unreviewed links with Umami attributes", () => {
  expect(reviewedLink).toHaveAttribute("data-umami-event", "region-market-click");
  expect(reviewedLink).toHaveAttribute("data-umami-event-reviewed", "true");
});
```

- [ ] **Step 2:** FAIL
- [ ] **Step 3:** 구현 (`useEffect`에서 `getKoreaCalendarDate(new Date())`로 today 설정, `MarketNextDate`와 같은 패턴)
- [ ] **Step 4:** PASS
- [ ] **Step 5:** 커밋 `feat: add client-side today and calendar for region pages`

### Task 5: 시·도 페이지 `/jangnal/[region]`

**Files:**
- Create: `apps/web/src/app/jangnal/[region]/page.tsx`, `page.module.css`, `page.test.tsx`
- Create: `apps/web/src/components/jangnal-market-list.tsx` (+ test) — 서버 컴포넌트, 시·군별 접기 목록(`<details>`)

**Interfaces:**
- Consumes: Task 1~4, `getMarketBrowsePath`, `reviewedMarketIds`, `MobileAppBar`, `SiteFooter`, `SITE_URL`
- Produces: `generateStaticParams()`, `generateMetadata()`, 기본 페이지 — `dynamicParams = false`

정적 본문 순서(디자인 시안과 동일): 제목 `"{shortName} 장날"`, 요약 `"5일장 {n}곳의 오늘·이번 주말 장날"`, 자료 기준일 안내, `<JangnalToday>`, 시·군별 전체 목록(시장명·패턴·`marketType`·주차, 검수=“상세 보기”, 미검수=“지도에서 보기”), 지역 소개, FAQ 2문항, 연결 링크(지도에서 이 지역 보기 `region-map-open`, 다른 1단계 시·도, 패턴 5개).

메타데이터: title `"{shortName} 장날 · 오늘 열리는 5일장 {n}곳 | 오늘 장날"`, description에 시장 수와 패턴 설명(날짜 없음), canonical `${SITE_URL}/jangnal/{slug}`, `ItemList` JSON-LD(검수 시장만 `url` 포함).

- [ ] **Step 1: 실패하는 테스트**
  - `generateStaticParams()`가 `isLaunchRegion`이 참인 슬러그만 반환 (테스트에서 `region-editorial` 모듈을 mock해 gyeongbuk만 있게)
  - 경북 페이지에 시·군 그룹 "경주시"와 "안강공설시장" 표시
  - 미검수 시장 링크 href가 `/?when=all&market=`로 시작
  - 메타 title·canonical 값
  - 정적 렌더 결과에 "10월"이나 "D-" 같은 날짜 문자열이 없음
  - 1단계가 아닌 슬러그(`seoul`)는 `notFound()`
- [ ] **Step 2:** FAIL
- [ ] **Step 3:** 구현
- [ ] **Step 4:** PASS
- [ ] **Step 5:** 커밋 `feat: add region landing pages`

### Task 6: 패턴 페이지 `/jangnal/days/[pattern]`

**Files:**
- Create: `apps/web/src/app/jangnal/days/[pattern]/page.tsx`, `page.module.css`, `page.test.tsx`

**Interfaces:**
- Consumes: Task 2 `getPatternMarkets`, `groupByRegion`, Task 4, Task 5의 `JangnalMarketList`

본문: 제목 `"{a}·{b}일장"`(예: "4·9일장"), 고정 설명 문구 "날짜 끝자리가 {a} 또는 {b}인 날 열리는 장입니다. 매월 {formatScheduleDates 결과}에 열립니다." 아래 `<JangnalToday>`는 "다음 장날" 날짜 목록만 크게, 시·도별 목록, 31일 규칙 FAQ(1·6일장 페이지에만).

- [ ] **Step 1:** 테스트 — params 5개, `4-9` 페이지 시장 87곳, `1-2`는 404, `1-6`에만 31일 FAQ
- [ ] **Step 2~4:** FAIL → 구현 → PASS
- [ ] **Step 5:** 커밋 `feat: add market-day pattern pages`

### Task 7: 전국 허브 `/jangnal`

**Files:**
- Create: `apps/web/src/app/jangnal/page.tsx`, `page.module.css`, `page.test.tsx`

본문: `<JangnalToday>`(전국, 오늘 목록은 시·도별 개수 요약으로 접음), 1단계 시·도 카드(이름 + 시장 수), 패턴 5개 링크, 1단계가 아닌 시·도는 이름만 보여 주고 "전국 지도에서 보기"(`/`) 링크 하나로 묶는다.

- [ ] **Step 1:** 테스트 — 1단계 시·도 링크만 `/jangnal/{slug}`, 패턴 링크 5개
- [ ] **Step 2~4:** FAIL → 구현 → PASS
- [ ] **Step 5:** 커밋 `feat: add nationwide market-day hub`

### Task 8: sitemap·내부 링크

**Files:**
- Modify: `apps/web/src/app/sitemap.ts` (+ `seo-routes.test.ts`)
- Modify: `apps/web/src/app/markets/[slug]/page.tsx` "같은 지역 장날" 섹션 아래 `"{shortName} 장날 전체 보기"` 링크(1단계 시·도일 때만)
- Modify: `apps/web/src/components/mobile-menu.tsx` 한국어 메뉴에 `"지역별 장날" → /jangnal`

- [ ] **Step 1:** 테스트 — sitemap에 `/jangnal`, 패턴 5개, 1단계 시·도만 포함(`changeFrequency: "daily"`); 경북 시장 상세에 링크(mock 상태); 메뉴 링크
- [ ] **Step 2~4:** FAIL → 구현 → PASS
- [ ] **Step 5:** 커밋 `feat: link region pages from sitemap, details and menu`

### Task 9: 지역 소개 8편 (콘텐츠, 사람 검수 필수)

- [ ] 경북·경남·전남·경기·충남·전북·충북·강원 순서로 `region-editorial.json`에 항목 추가. 출처(지자체·관광공사 페이지)와 확인일 필수, 확인되지 않은 사실은 쓰지 않는다.
- [ ] 항목이 들어간 시·도만 빌드·sitemap에 나타나는지 `pnpm build` 출력으로 확인.
- [ ] 커밋 `content: add region guides for {region}` (시·도별 1커밋)

### Task 10: 전체 검증

- [ ] `pnpm test`, `pnpm typecheck`, `pnpm build` 모두 통과
- [ ] `pnpm --filter @jangnal-map/web exec playwright test`에 `e2e/region-landing.spec.ts` 추가: 경북 페이지 모바일 뷰포트(390×844)에서 가로 스크롤 없음, 달력 칸 누르면 목록 변경, "지도에서 보기" 이동
- [ ] 디자인 기준 파일과 나란히 놓고 화면 비교(스크린샷)
- [ ] `CHANGELOG.md`, `VERSION`, README "지역별 장날" 절 갱신

## 열린 결정 (구현 전 확인)

1. 지역 소개 8편: 직접 작성 / Claude 초안 + 검수 — Task 9 담당자
2. AdSense 심사 결과 후 배포 / 바로 배포 — Task 9 이후 머지 시점
