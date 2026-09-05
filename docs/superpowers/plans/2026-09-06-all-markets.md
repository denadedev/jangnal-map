# 전체 전통시장 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 원본 공공데이터 1,393곳 전체를 검색·목록·지도에 포함하고 매일 운영, 정기 장날, 일정 미확인 시장을 모바일에서도 명확히 탐색할 수 있게 한다.

**Architecture:** 정적 CSV 생성 파이프라인이 모든 행을 구분된 일정 타입과 nullable 좌표를 가진 공개 JSON으로 변환한다. 브라우저는 일정 타입에 따라 필터와 문구를 계산하며, 지도는 낮은 확대 단계에서 순수 함수로 만든 격자 군집을, 높은 확대 단계에서 현재 영역의 개별 시장 핀을 표시한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, TanStack Query, NAVER Maps JavaScript API, Vitest

**Spec:** `docs/superpowers/specs/2026-09-06-all-markets-design.md`

## Global Constraints

- 공개 JSON에는 원본 1,393행을 모두 포함한다.
- 일정 타입은 `daily`, `digit-pair`, `unknown`만 사용한다.
- 좌표가 없는 시장은 목록·상세에는 표시하고 지도·길찾기에서는 제외한다.
- 기본 필터는 `이번 주`이며 오늘부터 7일을 뜻한다.
- 700px 이하 모바일에서 필터, 지도, 목록과 상세가 가로 페이지 스크롤을 만들지 않는다.
- 백엔드, 데이터베이스, 자동 동기화와 Vercel 배포는 추가하지 않는다.
- 기존 사용자 변경인 현재 위치 버튼과 지도 컨테이너 수정은 보존한다.

---

### Task 1: 공개 시장 타입·일정 계산·표시 확장

**Files:**
- Modify: `apps/web/src/lib/market.ts`
- Modify: `apps/web/src/lib/schedule.ts`
- Modify: `apps/web/src/lib/schedule.test.ts`
- Modify: `apps/web/src/lib/market-view.ts`
- Modify: `apps/web/src/components/market-list.tsx`
- Modify: `apps/web/src/components/market-detail.tsx`
- Modify: `apps/web/src/components/market-map.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`

**Interfaces:**
- Produces: `MarketSchedule`, `getMarketDates(market, range): Date[]`, `getNextMarketDate(market, from): Date | null`, `formatMarketTiming(market, from): string`
- Consumes: 없음

- [ ] **Step 1: 일정 타입별 동작을 고정하는 실패 테스트 작성**

```ts
const daily = { schedule: { kind: "daily" as const } };
const unknown = { schedule: { kind: "unknown" as const, raw: "2일+4일+7일+9일" } };

expect(getMarketDates(daily, { start: new Date(2026, 8, 7), end: new Date(2026, 8, 9) }))
  .toEqual([new Date(2026, 8, 7), new Date(2026, 8, 8), new Date(2026, 8, 9)]);
expect(getNextMarketDate(daily, new Date(2026, 8, 7))).toEqual(new Date(2026, 8, 7));
expect(getMarketDates(unknown, { start: new Date(2026, 8, 7), end: new Date(2026, 8, 9) })).toEqual([]);
expect(getNextMarketDate(unknown, new Date(2026, 8, 7))).toBeNull();
```

컴포넌트 테스트에는 매일 운영 시장의 `매일 운영`, 일정 미확인 시장의 `운영 일정 확인 필요`, 좌표 누락 시장의 `위치 확인 필요`와 길찾기 링크 미표시를 추가한다.

- [ ] **Step 2: 테스트가 타입 또는 동작 불일치로 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/schedule.test.ts`

Expected: `daily`와 `unknown`이 현재 `MarketSchedule`에 없거나 다음 날짜가 nullable이 아니어서 FAIL.

- [ ] **Step 3: 타입과 일정 계산을 최소 구현**

```ts
export type MarketSchedule =
  | { kind: "daily" }
  | { kind: "digit-pair"; days: [number, number] }
  | { kind: "unknown"; raw: string };

export interface PublicMarket {
  // 기존 필드 유지
  latitude: number | null;
  longitude: number | null;
  schedule: MarketSchedule;
}

export function getNextMarketDate(market: ScheduledMarket, from: Date): Date | null {
  if (market.schedule.kind === "unknown") return null;
  const date = atStartOfDay(from);
  if (market.schedule.kind === "daily") return date;
  while (!hasMarketDayEnding(date, market.schedule.days)) date.setDate(date.getDate() + 1);
  return date;
}
```

`getMarketDates`는 `daily`이면 범위의 모든 날짜, `unknown`이면 빈 배열, `digit-pair`이면 기존 규칙을 반환한다.

- [ ] **Step 4: 모든 기존 호출부를 일정·좌표 타입별로 안전하게 렌더링**

```ts
export function formatMarketTiming(market: PublicMarket, referenceDate: Date): string {
  if (market.schedule.kind === "daily") return "매일";
  if (market.schedule.kind === "unknown") return "일정 확인";
  const date = getNextMarketDate(market, referenceDate);
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : "일정 확인";
}
```

- 목록과 지도 핀은 `formatMarketTiming`을 공유한다.
- 상세 화면은 `daily`에서 `매일 운영`, `unknown`에서 `운영 일정 확인 필요`, `digit-pair`에서 기존 다음 장날·월별 날짜를 표시한다.
- 좌표가 null이면 길찾기 링크를 숨기고 `위치 확인 필요`를 표시한다.
- 군집 도입 전 지도는 좌표가 모두 number인 시장만 기존 개별 핀으로 렌더링한다.
- 헤더 배지는 하드코딩 대신 로드된 전체 시장 개수로 표시한다.

- [ ] **Step 5: 일정·표시 테스트와 타입 검사 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/schedule.test.ts src/components/market-explorer.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/lib/market.ts apps/web/src/lib/schedule.ts apps/web/src/lib/schedule.test.ts apps/web/src/lib/market-view.ts apps/web/src/components/market-list.tsx apps/web/src/components/market-detail.tsx apps/web/src/components/market-map.tsx apps/web/src/components/market-explorer.tsx apps/web/src/components/market-explorer.test.tsx
git commit -m "feat: support all market schedule types"
```

### Task 2: 원본 1,393행 전체 공개 데이터 생성

**Files:**
- Modify: `work/data-audit/src/generate-public-markets.ts`
- Modify: `work/data-audit/test/generate-public-markets.test.ts`
- Modify: `apps/web/public/data/markets.json`

**Interfaces:**
- Consumes: `parseSchedule(input): ParsedSchedule`, `hasValidCoordinates(market): boolean`
- Produces: `generatePublicMarkets(rawRows): PublicMarket[]` — 입력 행과 동일한 개수, 일정 유니언, 안전한 nullable 좌표

- [ ] **Step 1: 매일·일정 미확인·좌표 누락 행 보존 테스트 작성**

```ts
const generated = generatePublicMarkets([
  rawMarket({ 시장명: "제천중앙시장", 시장개설주기: "매일", 위도: "37.13662174", 경도: "128.211302" }),
  rawMarket({ 시장명: "일정미확인시장", 시장개설주기: "2일+4일+7일+9일", 위도: "", 경도: "" }),
]);

expect(generated).toHaveLength(2);
expect(generated[0].schedule).toEqual({ kind: "daily" });
expect(generated[1]).toMatchObject({
  latitude: null,
  longitude: null,
  schedule: { kind: "unknown", raw: "2일+4일+7일+9일" },
});
```

- [ ] **Step 2: 현재 게시 조건 때문에 행이 제외되어 실패하는지 확인**

Run: `pnpm --filter jangnal-market-data-audit test -- test/generate-public-markets.test.ts`

Expected: 결과 길이가 0 또는 1이라 FAIL.

- [ ] **Step 3: 모든 정규화 행을 공개 형태로 변환**

```ts
const publicSchedule = (raw: string | null): PublicMarket["schedule"] => {
  const parsed = parseSchedule(raw);
  if (parsed.kind === "daily") return { kind: "daily" };
  if (parsed.kind === "digit-pair") {
    return { kind: "digit-pair", days: [parsed.days[0], parsed.days[1] === 10 ? 0 : parsed.days[1]] };
  }
  return { kind: "unknown", raw: parsed.raw };
};

const coordinates = hasValidCoordinates(market)
  ? { latitude: market.latitude, longitude: market.longitude }
  : { latitude: null, longitude: null };
```

`publicMarket`의 게시 조건을 제거하고 항상 `PublicMarket`을 반환한다. ID 생성 입력은 기존 필드를 유지해 기존 400개 시장의 URL ID가 바뀌지 않게 한다.

- [ ] **Step 4: 생성기 테스트 실행**

Run: `pnpm --filter jangnal-market-data-audit test -- test/generate-public-markets.test.ts`

Expected: PASS.

- [ ] **Step 5: 실제 공개 JSON 재생성 및 개수 확인**

Run:

```bash
pnpm --filter jangnal-market-data-audit generate -- \
  --input data/raw/markets.csv \
  --encoding euc-kr \
  --output ../../apps/web/public/data/markets.json
```

Expected: `{"rows":1393,...}` 출력. 이어서 `node -e 'const d=require("./apps/web/public/data/markets.json"); console.log(d.length)'`가 `1393` 출력.

- [ ] **Step 6: 커밋**

```bash
git add work/data-audit/src/generate-public-markets.ts work/data-audit/test/generate-public-markets.test.ts apps/web/public/data/markets.json
git commit -m "feat: publish the full traditional market dataset"
```

### Task 3: 전체·오늘·7일·주말·직접 날짜 필터 구현

**Files:**
- Modify: `apps/web/src/components/market-filters.tsx`
- Modify: `apps/web/src/components/market-filters.test.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`
- Modify: `apps/web/src/lib/market-view.ts`
- Modify: `apps/web/src/lib/market-view.test.ts`

**Interfaces:**
- Consumes: Task 1의 일정 유니언과 `getMarketDates`
- Produces: `DateFilterMode = "all" | "today" | "week" | "weekend" | "date"`, `getDateRange(...): DateRange | null`, `filterMarkets(..., range: DateRange | null): PublicMarket[]`

- [ ] **Step 1: 필터 의미 실패 테스트 작성**

```ts
const sunday = new Date(2026, 8, 6);
expect(getDateRange("all", sunday, "2026-09-06")).toBeNull();
expect(getDateRange("week", sunday, "2026-09-06")).toEqual({
  start: new Date(2026, 8, 6),
  end: new Date(2026, 8, 12),
});
expect(getDateRange("weekend", sunday, "2026-09-06")).toEqual({
  start: new Date(2026, 8, 12),
  end: new Date(2026, 8, 13),
});
expect(filterMarkets([dailyMarket, periodicMarket, unknownMarket], "", null)).toHaveLength(3);
```

MarketFilters 테스트에는 `전체` 클릭 시 `onModeChange("all")` 호출과 `날짜 선택` 클릭 시 `showPicker()` 또는 `focus()` 호출을 추가한다.

- [ ] **Step 2: 기존 달력 주 계산과 누락된 전체 타입 때문에 실패 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-view.test.ts src/components/market-filters.test.tsx`

Expected: 타입 또는 범위 값 불일치로 FAIL.

- [ ] **Step 3: 필터 범위와 전체 모드 구현**

```ts
export function getDateRange(mode: DateFilterMode, today: Date, directDate: string): DateRange | null {
  const day = atStartOfDay(today);
  if (mode === "all") return null;
  if (mode === "today") return { start: day, end: day };
  if (mode === "date") {
    const selected = normalizeDirectDate(directDate, day);
    return { start: selected, end: selected };
  }
  if (mode === "week") {
    const end = new Date(day);
    end.setDate(day.getDate() + 6);
    return { start: day, end };
  }
  const daysUntilSaturday = day.getDay() === 0 ? 6 : (6 - day.getDay() + 7) % 7;
  const saturday = new Date(day);
  saturday.setDate(day.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { start: saturday, end: sunday };
}
```

`filterMarkets`는 검색어를 먼저 적용하고 `range === null`이면 일정 검사를 생략한다. 날짜 범위가 있으면 `daily`와 범위 내 정기시장은 포함하고 `unknown`은 제외한다.

- [ ] **Step 4: 날짜 선택기 버튼 연결**

MarketFilters에 `useRef<HTMLInputElement>`를 추가한다. `날짜 선택` 버튼 클릭 시 `onModeChange("date")` 후 `input.showPicker?.()`를 호출하고, 지원하지 않으면 `input.focus()`를 호출한다. 날짜 입력에는 ref를 연결한다.

- [ ] **Step 5: 탐색기에서 nullable 범위 처리**

```ts
const range = useMemo(() => getDateRange(mode, today, directDate), [directDate, mode, today]);
const referenceDate = range?.start ?? today;
const filteredMarkets = useMemo(() => filterMarkets(markets, query, range), [markets, query, range]);
```

URL 복원용 `validModes`에 `all`을 추가하고 `전체`에서도 선택 시장 URL 유지 규칙을 보존한다.

- [ ] **Step 6: 필터 관련 테스트 실행**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-view.test.ts src/components/market-filters.test.tsx src/components/market-explorer.test.tsx`

Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add apps/web/src/components/market-filters.tsx apps/web/src/components/market-filters.test.tsx apps/web/src/components/market-explorer.tsx apps/web/src/components/market-explorer.test.tsx apps/web/src/lib/market-view.ts apps/web/src/lib/market-view.test.ts
git commit -m "feat: add useful full-market date filters"
```

### Task 4: 전국 지도 군집과 모바일 최종 검증

**Files:**
- Create: `apps/web/src/lib/market-clusters.ts`
- Create: `apps/web/src/lib/market-clusters.test.ts`
- Modify: `apps/web/src/lib/naver-maps.ts`
- Modify: `apps/web/src/components/market-map.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: 좌표가 모두 number인 시장 배열과 Task 1의 `formatMarketTiming`
- Produces: `buildMapItems(markets, zoom, bounds): MapItem[]`

```ts
export type MapItem =
  | { kind: "market"; market: PublicMarket }
  | { kind: "cluster"; id: string; latitude: number; longitude: number; count: number };

export interface CoordinateBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export function buildMapItems(
  markets: PublicMarket[],
  zoom: number,
  bounds: CoordinateBounds,
): MapItem[];
```

- [ ] **Step 1: 군집 순수 함수 실패 테스트 작성**

```ts
expect(buildMapItems(nearbyMarkets, 7, koreaBounds)).toEqual([
  expect.objectContaining({ kind: "cluster", count: 3 }),
]);
expect(buildMapItems(nearbyMarkets, 12, localBounds)).toEqual([
  { kind: "market", market: nearbyMarkets[0] },
]);
expect(buildMapItems([coordinateMissingMarket], 7, koreaBounds)).toEqual([]);
```

- [ ] **Step 2: 모듈이 없어 실패하는지 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/market-clusters.test.ts`

Expected: 모듈을 찾을 수 없어 FAIL.

- [ ] **Step 3: 확대 단계별 격자 군집 구현**

확대 `11` 이상이면 bounds 안의 시장을 개별 항목으로 반환한다. 그 미만에서는 확대 단계별 격자 크기 `{ 6: 2.5, 7: 2.0, 8: 1.0, 9: 0.5, 10: 0.2 }`도로 좌표를 그룹화하고, 한 시장만 있는 셀은 개별 항목, 두 곳 이상은 평균 좌표의 군집 항목을 반환한다. null 좌표는 항상 제외한다.

- [ ] **Step 4: NAVER 지도 타입을 실제 사용 범위로 확장**

```ts
interface NaverBounds {
  getNE(): { lat(): number; lng(): number };
  getSW(): { lat(): number; lng(): number };
}

export interface NaverMapInstance {
  panTo(position: NaverLatLng): void;
  setZoom(zoom: number): void;
  getZoom(): number;
  getBounds(): NaverBounds;
}
```

`Event.addListener`의 target을 지도와 마커 모두 받을 수 있게 확장한다.

- [ ] **Step 5: 지도 idle 이벤트에서 군집·개별 핀 렌더링**

지도 준비와 `idle` 이벤트에서 현재 zoom/bounds를 읽어 `buildMapItems`를 호출한다. 기존 마커 정리 로직을 재사용하며 다음 HTML을 사용한다.

```ts
const clusterHtml = `<button class="map-cluster" type="button" aria-label="이 지역 시장 ${item.count}곳">${item.count}</button>`;
const marketHtml = `<button class="map-marker" type="button"><span>${escapeHtml(market.name)}</span><strong>${formatMarketTiming(market, referenceDate)}</strong></button>`;
```

군집 클릭 시 평균 좌표로 `panTo`하고 `setZoom(Math.min(currentZoom + 2, 13))`한다. 개별 핀 클릭은 기존 상세 선택을 유지한다. 현재 위치 마커는 군집 재렌더링과 별도로 보존한다.

- [ ] **Step 6: 모바일 필터·군집 스타일 작성**

- 데스크톱 필터는 다섯 버튼과 날짜 입력이 한 행에 맞게 간격을 축소한다.
- 700px 이하에서는 필터 버튼을 두 줄 flex-wrap으로 배치한다.
- `.map-cluster`는 최소 42x42px 터치 영역, 높은 대비, 개수 텍스트를 가진다.
- `.map-marker`와 현재 위치 버튼은 기존 스타일을 유지한다.
- `html`, `body`, `.explorer-shell`에서 가로 overflow가 발생하지 않는지 확인한다.

- [ ] **Step 7: 군집 테스트와 전체 검증 실행**

Run:

```bash
pnpm --filter @jangnal-map/web test -- src/lib/market-clusters.test.ts
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: 모든 명령 exit 0, 테스트 실패 0, `/`가 Static으로 빌드.

- [ ] **Step 8: 실제 브라우저 검증**

프로덕션 서버를 `3030` 포트에서 다시 시작하고 다음을 확인한다.

1. `/`에서 전국 군집과 `전국 시장 1,393곳` 표시
2. `제천중앙시장` 검색 결과와 `매일 운영` 상세
3. 오늘·이번 주·주말 결과가 2026-09-06 기준 서로 의미 있게 변경
4. 직접 날짜 `2026-09-07` 선택 시 URL과 결과 날짜 변경
5. 군집 선택 후 확대 및 개별 시장명 핀 전환
6. 375px viewport에서 필터 두 줄, 지도, 목록, 하단 상세 시트에 가로 스크롤 없음
7. 콘솔 오류 없음

- [ ] **Step 9: README와 결과 커밋**

README 시장 데이터 설명을 1,393곳 전체, 일정 타입과 군집 방식으로 갱신한다.

```bash
git add apps/web/src/lib/market-clusters.ts apps/web/src/lib/market-clusters.test.ts apps/web/src/lib/naver-maps.ts apps/web/src/components/market-map.tsx apps/web/src/app/globals.css README.md
git commit -m "feat: cluster the full market map on desktop and mobile"
```
