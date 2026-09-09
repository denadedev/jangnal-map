# 온누리상품권 시장별 가맹점 수 Implementation Plan

## 승인 후 범위 조정

로컬 미리보기 검토에서 `/onnuri`의 시장 검색과 인기 시장 목록은 기존 지도 흐름과 중복된다고 판단해 제거했다. 최종 구현은 시장별 수치를 지도 선택 상세와 정적 시장 상세에만 표시한다. `/onnuri`는 온누리상품권 개요, 디지털형·지류형 안내, 주의사항과 공식 온누리 플레이스(`https://www.onnuri.gift/place`) 링크만 제공한다. Task 7의 검색 컴포넌트와 인기 시장 목록은 이 결정으로 폐기됐으며 관련 파일도 제거했다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공식 온누리상품권 가맹점 데이터를 기존 전통시장 데이터와 안전하게 결합해 전체·디지털·지류 가맹점 수를 노출하고 `/onnuri` 검색 허브와 시장별 SEO를 제공한다.

**Architecture:** 공공데이터포털 CSV를 로컬 데이터 생성 단계에서 읽고, 시장명과 지역을 정규화해 기존 시장 ID에 매칭한 뒤 `markets.json`에 정적 집계값을 저장한다. 런타임에는 외부 API를 호출하지 않으며, 지도 상세·정적 상세·온누리 허브가 같은 `PublicMarket.onnuri` 계약을 사용한다.

**Tech Stack:** TypeScript 7/5.9, Next.js 16 App Router, React 19, Vitest, Testing Library, `csv-parse`, 정적 JSON

**Spec:** `docs/superpowers/specs/2026-09-09-onnuri-market-counts-design.md`

## Global Constraints

- 데이터 원천은 소상공인시장진흥공단 `전국 온누리상품권 가맹점 현황_20250731`이며 기준일은 `2025-07-31`이다. 실제 다운로드 파일은 150,541행이며 포털 화면의 전체 행 표시는 125,589다.
- 전체 가맹점 수는 디지털 수와 지류 수의 합이 아니라 정규화된 점포의 중복 제거 수다.
- 자동 매칭이 하나의 내부 시장으로 확정되지 않으면 수치를 붙이지 않는다.
- 미매칭은 `0곳`이 아니라 `onnuri: null`로 표현한다.
- 페이지 요청 중 외부 API를 호출하지 않는다.
- 개별 가맹점 목록, 지역별 랜딩 페이지, 결제 기능은 만들지 않는다.
- 수치가 있는 시장만 온누리상품권 수치를 SEO 제목과 설명에 포함한다.

---

## File Map

- `work/data-audit/src/onnuri.ts`: 온누리 원본 파싱용 타입, 값 정규화, 점포 중복 제거와 결제 유형 집계
- `work/data-audit/src/onnuri-match.ts`: 기존 시장과 온누리 시장의 자동·수동 매칭, 충돌 및 미매칭 보고서 생성
- `work/data-audit/src/enrich-public-markets.ts`: 기존 공개 시장 JSON에 온누리 집계를 원자적으로 병합하는 CLI
- `work/data-audit/data/onnuri-market-overrides.json`: 검증된 원본 시장명·지역에서 내부 시장 ID로 가는 수동 예외
- `work/data-audit/test/fixtures/onnuri-merchants.csv`: 파서·집계·매칭 테스트용 최소 원본
- `work/data-audit/test/fixtures/onnuri-missing-column.csv`: 필수 열 검증용 잘못된 원본
- `work/data-audit/test/onnuri.test.ts`: 파싱, 중복 제거, 결제 유형 집계 테스트
- `work/data-audit/test/onnuri-match.test.ts`: 동명 시장, 수동 매핑, 충돌, 미매칭 테스트
- `work/data-audit/src/generate-public-markets.ts`: 온누리 입력을 받아 공개 시장 JSON과 품질 보고서를 원자적으로 생성
- `work/data-audit/test/generate-public-markets.test.ts`: `onnuri` 계약 및 산출물 검증
- `work/data-audit/SOURCE.md`: 공식 데이터셋, 기준일, 재생성 명령 기록
- `outputs/온누리상품권-매칭-결과.md`: 실제 데이터 매칭 품질 보고서
- `apps/web/src/lib/market.ts`: `OnnuriMerchantSummary`와 `PublicMarket.onnuri` 공개 타입
- `apps/web/src/components/onnuri-summary.tsx`: 상세 화면들이 공유하는 온누리 수치·기준일·공식 링크 UI
- `apps/web/src/components/onnuri-summary.module.css`: 공유 요약 카드 스타일
- `apps/web/src/components/onnuri-summary.test.tsx`: 값 있음·없음 상태의 접근성 및 문구 테스트
- `apps/web/src/components/market-detail.tsx`: 지도 상세 패널에 공유 요약 카드 연결
- `apps/web/src/components/market-explorer.test.tsx`: 지도 상세 통합 회귀 테스트
- `apps/web/src/app/markets/[slug]/page.tsx`: 정적 시장 상세에 요약 카드 연결
- `apps/web/src/app/markets/[slug]/page.test.tsx`: 정적 상세 통합 회귀 테스트
- `apps/web/src/lib/market-seo.ts`: 온누리 수치가 있는 시장의 제목·설명 생성
- `apps/web/src/lib/market-seo.test.ts`: 수치 유무별 SEO 문구 테스트
- `apps/web/src/components/onnuri-market-search.tsx`: `/onnuri`의 클라이언트 시장명·지역 검색
- `apps/web/src/components/onnuri-market-search.test.tsx`: 검색 결과와 빈 상태 테스트
- `apps/web/src/app/onnuri/page.tsx`: 온누리상품권 허브, 메타데이터, 상위 시장 서버 렌더링
- `apps/web/src/app/onnuri/page.module.css`: 허브 반응형 레이아웃
- `apps/web/src/app/onnuri/page.test.tsx`: 허브 콘텐츠와 링크 테스트
- `apps/web/src/app/sitemap.ts`: `/onnuri` canonical 항목 추가
- `apps/web/src/app/seo-routes.test.ts`: 사이트맵 계약 갱신
- `apps/web/src/components/market-explorer.tsx`: 홈 헤더에서 온누리 허브로 가는 내부 링크
- `apps/web/src/app/globals.css`: 홈 헤더 링크의 기존 디자인 체계 내 최소 스타일
- `apps/web/public/data/markets.json`: 실제 집계가 병합된 정적 산출물

---

### Task 1: 온누리 CSV 파싱과 중복 제거 집계

**Files:**
- Create: `work/data-audit/src/onnuri.ts`
- Create: `work/data-audit/test/fixtures/onnuri-merchants.csv`
- Create: `work/data-audit/test/onnuri.test.ts`

**Interfaces:**
- Produces: `RawOnnuriMerchant`, `NormalizedOnnuriMerchant`, `OnnuriMarketAggregate`, `OnnuriRowIssue`, `OnnuriAggregateResult`
- Produces: `readOnnuriCsv(path: string, encoding: CsvEncoding): Promise<RawOnnuriMerchant[]>`
- Produces: `normalizeOnnuriMerchant(row: RawOnnuriMerchant, rowNumber: number): { merchant: NormalizedOnnuriMerchant | null; issue: OnnuriRowIssue | null }`
- Produces: `aggregateOnnuriMerchants(rows: RawOnnuriMerchant[]): OnnuriAggregateResult`

- [ ] **Step 1: 원본 계약과 집계 규칙을 고정하는 실패 테스트 작성**

```ts
it("동일 점포의 디지털·지류 행을 하나의 전체 가맹점으로 집계한다", async () => {
  const rows = await readOnnuriCsv("test/fixtures/onnuri-merchants.csv", "utf8");
  const { aggregates, issues } = aggregateOnnuriMerchants(rows);
  const aggregate = aggregates.find(({ marketName }) => marketName === "운천전통시장");

  expect(aggregate).toMatchObject({ totalCount: 2, digitalCount: 2, paperCount: 1 });
  expect(issues).toEqual([]);
});

it("필수 열이 없으면 원본을 거부한다", async () => {
  await expect(readOnnuriCsv("test/fixtures/onnuri-missing-column.csv", "utf8"))
    .rejects.toThrow("디지털형 가맹 여부");
});
```

Fixture 헤더는 실제 2025 원본과 동일하게 `가맹점명,소속 시장명(또는 상점가),소재지,취급품목,지류형 가맹 여부,디지털형 가맹 여부,등록년도`를 사용한다. `운천상회`를 디지털·지류 중복 행으로, `영북식품`을 디지털 전용 행으로 넣는다.

- [ ] **Step 2: 테스트가 구현 부재로 실패하는지 확인**

Run: `pnpm --dir work/data-audit test -- onnuri.test.ts`

Expected: FAIL with module `../src/onnuri.js` not found.

- [ ] **Step 3: 최소 파서·정규화·집계 구현**

```ts
export interface RawOnnuriMerchant {
  가맹점명: string;
  "소속 시장명(또는 상점가)": string;
  소재지: string;
  취급품목: string;
  "지류형 가맹 여부": string;
  "디지털형 가맹 여부": string;
  등록년도: string;
}

export interface OnnuriMarketAggregate {
  marketName: string;
  region: string;
  totalCount: number;
  digitalCount: number;
  paperCount: number;
}

export interface OnnuriAggregateResult {
  aggregates: OnnuriMarketAggregate[];
  issues: Array<{ rowNumber: number; field: string; value: string }>;
}
```

`csv-parse/sync`로 열을 검증하고, 공백·괄호·`전통시장`/`시장` 접미를 정규화용 보조 키에서만 제거한다. 점포 키는 `시장 키|가맹점명 키|주소 키`로 만들고 주소가 없는 중복 행에는 원본 행 번호를 넣는다. 가맹 여부는 실제 원본에서 확인한 허용 값만 참으로 처리한다. 그 외 비어 있지 않은 값은 `issues`에 행 번호·필드·원본 값을 남기고 해당 행을 집계에서 제외한다.

- [ ] **Step 4: 파서와 집계 테스트 통과 확인**

Run: `pnpm --dir work/data-audit test -- onnuri.test.ts`

Expected: PASS, including `totalCount !== digitalCount + paperCount` fixture.

- [ ] **Step 5: 커밋**

```bash
git add work/data-audit/src/onnuri.ts work/data-audit/test/fixtures/onnuri-merchants.csv work/data-audit/test/fixtures/onnuri-missing-column.csv work/data-audit/test/onnuri.test.ts
git commit -m "feat: aggregate onnuri merchant data"
```

---

### Task 2: 시장 매칭과 품질 보고서

**Files:**
- Create: `work/data-audit/src/onnuri-match.ts`
- Create: `work/data-audit/data/onnuri-market-overrides.json`
- Create: `work/data-audit/test/onnuri-match.test.ts`

**Interfaces:**
- Consumes: `OnnuriAggregateResult.aggregates` from Task 1
- Produces: `OnnuriMerchantSummary`, `OnnuriMatchReport`, `OnnuriMatchResult`
- Produces: `matchOnnuriMarkets(markets: PublicMarket[], aggregates: OnnuriMarketAggregate[], overrides: Record<string, string>, referenceDate: string): OnnuriMatchResult`
- Produces: `renderOnnuriMatchReport(report: OnnuriMatchReport, issues: OnnuriRowIssue[]): string`

- [ ] **Step 1: 안전한 매칭 조건의 실패 테스트 작성**

```ts
it("시장명과 시군구가 모두 맞을 때만 자동 연결한다", () => {
  const result = matchOnnuriMarkets(markets, aggregates, {}, "2025-07-31");
  expect(result.summariesByMarketId.get("uncheon")?.totalCount).toBe(2);
  expect(result.report.conflicts).toContainEqual(expect.objectContaining({ marketName: "중앙시장" }));
});

it("수동 매핑은 원본 시장 키를 검증된 내부 ID에 연결한다", () => {
  const result = matchOnnuriMarkets(markets, aggregates, { "경기도 포천시|운천시장": "uncheon" }, "2025-07-31");
  expect(result.report.manualMatches).toBe(1);
});
```

동명 `중앙시장` 두 곳, 지역 충돌 한 곳, 미매칭 한 곳을 fixture 객체로 구성한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --dir work/data-audit test -- onnuri-match.test.ts`

Expected: FAIL with module `../src/onnuri-match.js` not found.

- [ ] **Step 3: 결정적 매칭과 보고서 구현**

```ts
export interface OnnuriMerchantSummary {
  totalCount: number;
  digitalCount: number;
  paperCount: number;
  referenceDate: string;
  source: { name: string; url: string };
}

export interface OnnuriMatchResult {
  summariesByMarketId: Map<string, OnnuriMerchantSummary>;
  report: OnnuriMatchReport;
}
```

이름 키 후보가 하나이고 주소에서 추출한 시·군·구가 일치할 때만 자동 매칭한다. 후보가 여러 개면 지역으로 하나가 확정될 때만 연결한다. 수동 매핑 키는 `시도 시군구|정규화 시장명`으로 고정하고, 존재하지 않는 내부 ID를 가리키면 즉시 실패시킨다. 보고서에는 원본 행 수, 중복 제거 점포 수, 자동·수동·미매칭·충돌 시장 수, 제외된 원본 행과 충돌 목록을 정렬해 기록한다.

- [ ] **Step 4: 매칭 테스트와 타입 검사**

Run: `pnpm --dir work/data-audit test -- onnuri-match.test.ts`

Expected: PASS.

Run: `pnpm --dir work/data-audit typecheck`

Expected: exit 0.

- [ ] **Step 5: 커밋**

```bash
git add work/data-audit/src/onnuri-match.ts work/data-audit/data/onnuri-market-overrides.json work/data-audit/test/onnuri-match.test.ts
git commit -m "feat: match onnuri data to markets"
```

---

### Task 3: 공개 시장 생성 파이프라인에 온누리 집계 연결

**Files:**
- Create: `work/data-audit/src/enrich-public-markets.ts`
- Modify: `work/data-audit/src/generate-public-markets.ts`
- Modify: `work/data-audit/test/generate-public-markets.test.ts`
- Modify: `work/data-audit/package.json`
- Modify: `work/data-audit/SOURCE.md`
- Modify: `apps/web/src/lib/market.ts`

**Interfaces:**
- Consumes: `readOnnuriCsv`, `aggregateOnnuriMerchants`, `matchOnnuriMarkets`, `renderOnnuriMatchReport`
- Produces: `PublicMarket.onnuri: OnnuriMerchantSummary | null`
- CLI: `pnpm --dir work/data-audit enrich:onnuri -- --markets ../../apps/web/public/data/markets.json --onnuri /tmp/onnuri-merchants-20250731.csv --onnuri-encoding utf8 --onnuri-reference-date 2025-07-31 --overrides data/onnuri-market-overrides.json --output ../../apps/web/public/data/markets.json --report ../../outputs/온누리상품권-매칭-결과.md`

- [ ] **Step 1: 공개 계약과 원자적 산출물 실패 테스트 작성**

```ts
it("온누리 매칭 결과를 시장 ID별로 병합하고 미매칭은 null로 둔다", () => {
  const generated = generatePublicMarkets(rawRows);
  const enriched = attachOnnuriSummaries(generated, new Map([[generated[0]!.id, summary]]));
  expect(enriched[0]!.onnuri).toEqual(summary);
  expect(enriched[1]!.onnuri).toBeNull();
});
```

커밋된 `markets.json` 계약 테스트에는 모든 행에 `onnuri` 키가 있으며 값이 있으면 세 카운트가 0 이상의 정수이고 `totalCount >= digitalCount`, `totalCount >= paperCount`임을 추가한다.

- [ ] **Step 2: 새 계약으로 테스트가 실패하는지 확인**

Run: `pnpm --dir work/data-audit test -- generate-public-markets.test.ts`

Expected: FAIL because `attachOnnuriSummaries` and `onnuri` do not exist.

- [ ] **Step 3: 생성기와 웹 타입에 최소 계약 구현**

```ts
export interface OnnuriMerchantSummary {
  totalCount: number;
  digitalCount: number;
  paperCount: number;
  referenceDate: string;
  source: { name: string; url: string };
}

export interface PublicMarket {
  // existing fields
  onnuri: OnnuriMerchantSummary | null;
}
```

`generatePublicMarkets`가 기본적으로 `onnuri: null`을 생성하게 하고, `attachOnnuriSummaries`는 새 배열을 반환한다. 별도 `enrich-public-markets.ts` CLI는 커밋된 기존 `markets.json`을 입력으로 읽어 모든 파싱과 매칭이 성공한 뒤 임시 파일에 JSON과 보고서를 쓰고 최종 경로로 rename해 부분 덮어쓰기를 막는다. `SOURCE.md`에는 데이터셋 URL, 실제 다운로드 150,541행과 포털 표시 125,589행의 차이, 2025-07-31 기준, 연간 갱신과 실행 명령을 기록한다.

- [ ] **Step 4: 관련 테스트와 양쪽 타입 검사**

Run: `pnpm --dir work/data-audit test -- generate-public-markets.test.ts`

Expected: PASS.

Run: `pnpm --dir work/data-audit typecheck`

Expected: exit 0.

Run: `pnpm --dir apps/web typecheck`

Expected: FAIL only in typed test fixtures that have not yet added `onnuri`.

- [ ] **Step 5: 모든 `PublicMarket` 테스트 fixture에 명시적 기본값 추가**

`apps/web/src/components/market-explorer.test.tsx`, `market-list.test.tsx`, `market-next-date.test.tsx`, `apps/web/src/lib/market-clusters.test.ts`, `market-seo.test.ts`, `market-view.test.ts`의 `PublicMarket` 객체에 `onnuri: null`을 추가한다. 온누리 표시 테스트에서만 실제 요약 객체를 사용한다.

- [ ] **Step 6: 전체 타입 검사와 커밋**

Run: `pnpm --dir apps/web typecheck`

Expected: exit 0.

```bash
git add work/data-audit/src/enrich-public-markets.ts work/data-audit/src/generate-public-markets.ts work/data-audit/test/generate-public-markets.test.ts work/data-audit/package.json work/data-audit/SOURCE.md apps/web/src/lib/market.ts apps/web/src/components/market-explorer.test.tsx apps/web/src/components/market-list.test.tsx apps/web/src/components/market-next-date.test.tsx apps/web/src/lib/market-clusters.test.ts apps/web/src/lib/market-seo.test.ts apps/web/src/lib/market-view.test.ts
git commit -m "feat: publish onnuri summaries with markets"
```

---

### Task 4: 실제 2025 공식 데이터 병합과 품질 검토

**Files:**
- Modify: `work/data-audit/data/onnuri-market-overrides.json`
- Modify: `apps/web/public/data/markets.json`
- Create: `outputs/온누리상품권-매칭-결과.md`

**Interfaces:**
- Consumes: Task 3의 `generate:onnuri` CLI
- Produces: 실제 수치가 든 `markets.json`, 사람이 검토 가능한 매칭 보고서

- [ ] **Step 1: 공식 원본을 임시 경로에 내려받고 스키마 확인**

공공데이터포털 데이터셋 `3060079`의 `소상공인시장진흥공단_전국 온누리상품권 가맹점 현황_20250731.csv`를 `/tmp/onnuri-merchants-20250731.csv`로 내려받는다. 첫 행이 Task 1의 7개 열과 일치하고 실제 다운로드 데이터 행이 `150541`개인지 확인한다.

Run: `python -c 'import csv; p="/tmp/onnuri-merchants-20250731.csv"; f=open(p, encoding="utf-8-sig"); r=csv.reader(f); h=next(r); rows=sum(1 for _ in r); print(h); print(rows)'`

Expected: 7개 공식 헤더와 `150541`.

- [ ] **Step 2: 최초 생성으로 충돌·미매칭 기준선 확보**

Run: Task 3에 명시된 `pnpm --dir work/data-audit enrich:onnuri` 명령.

Expected: JSON과 Markdown 보고서가 생성되고, `totalCount >= digitalCount` 및 `totalCount >= paperCount` 무결성 오류가 0건이다.

- [ ] **Step 3: 충돌을 검토하고 검증 가능한 항목만 수동 매핑**

보고서의 동일 이름 후보는 원본과 기존 시장 주소의 시·군·구가 일치할 때만 `onnuri-market-overrides.json`에 추가한다. 주소로도 하나를 고를 수 없는 후보는 미매칭으로 남긴다. 변경 후 생성 명령을 다시 실행한다.

- [ ] **Step 4: 산출물 품질 검증**

Run: `pnpm --dir work/data-audit test`

Expected: PASS; 공개 시장 1,393개 유지, 중복 ID 0개, 온누리 수치가 있는 시장 1개 이상, 카운트 무결성 오류 0개.

Run: `git diff --stat apps/web/public/data/markets.json outputs/온누리상품권-매칭-결과.md`

Expected: 시장 개수 변화 없이 `onnuri` 필드와 품질 보고서만 추가.

- [ ] **Step 5: 커밋**

```bash
git add work/data-audit/data/onnuri-market-overrides.json apps/web/public/data/markets.json outputs/온누리상품권-매칭-결과.md
git commit -m "data: add official onnuri merchant counts"
```

---

### Task 5: 공용 온누리 요약 카드와 두 상세 화면 연결

**Files:**
- Create: `apps/web/src/components/onnuri-summary.tsx`
- Create: `apps/web/src/components/onnuri-summary.module.css`
- Create: `apps/web/src/components/onnuri-summary.test.tsx`
- Modify: `apps/web/src/components/market-detail.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `OnnuriMerchantSummary | null`
- Produces: `OnnuriSummary({ marketName, summary, headingLevel }: { marketName: string; summary: OnnuriMerchantSummary | null; headingLevel: 2 | 3 }): JSX.Element`

- [ ] **Step 1: 값 있음·없음 UI 실패 테스트 작성**

```tsx
it("전체·디지털·지류 수와 기준일을 표시한다", () => {
  render(<OnnuriSummary marketName="운천전통시장" summary={summary} headingLevel={3} />);
  expect(screen.getByRole("heading", { name: "온누리상품권" })).toBeInTheDocument();
  expect(screen.getByText("가맹점 총 83곳")).toBeInTheDocument();
  expect(screen.getByText("디지털 71곳")).toBeInTheDocument();
  expect(screen.getByText("지류 65곳")).toBeInTheDocument();
  expect(screen.getByText("2025.07.31 기준")).toBeInTheDocument();
});

it("집계가 없으면 0곳 대신 확인 필요를 표시한다", () => {
  render(<OnnuriSummary marketName="운천전통시장" summary={null} headingLevel={2} />);
  expect(screen.getByText("가맹점 수 확인 필요")).toBeInTheDocument();
  expect(screen.queryByText("0곳")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 컴포넌트 부재로 실패 확인**

Run: `pnpm --dir apps/web test -- onnuri-summary.test.tsx`

Expected: FAIL with module not found.

- [ ] **Step 3: 공용 컴포넌트와 반응형 스타일 구현**

공식 링크는 `https://onnurigift.or.kr/`로 두고 새 창 속성을 적용한다. 문구는 `점포별 취급 여부는 변경될 수 있으니 방문 전 공식 가맹점 찾기에서 확인하세요.`로 고정한다. `Intl.NumberFormat("ko-KR")`로 숫자를 표시하고 `YYYY-MM-DD`를 `YYYY.MM.DD`로 변환한다.

```tsx
export function OnnuriSummary({ marketName, summary, headingLevel }: OnnuriSummaryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={`onnuri-${marketName}`}>
      <Heading id={`onnuri-${marketName}`}>온누리상품권</Heading>
      {summary ? (
        <>
          <strong>가맹점 총 {formatCount(summary.totalCount)}곳</strong>
          <p>디지털 {formatCount(summary.digitalCount)}곳 · 지류 {formatCount(summary.paperCount)}곳</p>
          <small>{formatReferenceDate(summary.referenceDate)} 기준</small>
        </>
      ) : <strong>가맹점 수 확인 필요</strong>}
      <p>점포별 취급 여부는 변경될 수 있으니 방문 전 공식 가맹점 찾기에서 확인하세요.</p>
      <a href="https://onnurigift.or.kr/" target="_blank" rel="noreferrer">공식 가맹점 찾기</a>
    </section>
  );
}
```

- [ ] **Step 4: 공용 컴포넌트 테스트 통과 확인**

Run: `pnpm --dir apps/web test -- onnuri-summary.test.tsx`

Expected: PASS.

- [ ] **Step 5: 지도 상세와 정적 상세에 같은 컴포넌트 연결**

`MarketDetail`의 방문 정보 다음에 `headingLevel={3}`으로, `/markets/[slug]`의 방문 정보 다음에 별도 `.section` 안에서 `headingLevel={2}`로 렌더링한다. 각 통합 테스트에는 전체·디지털·지류 수와 공식 링크가 한 번씩 보이는지 추가한다.

- [ ] **Step 6: 상세 화면 회귀 테스트와 커밋**

Run: `pnpm --dir apps/web test -- onnuri-summary.test.tsx market-explorer.test.tsx page.test.tsx`

Expected: PASS.

```bash
git add apps/web/src/components/onnuri-summary.tsx apps/web/src/components/onnuri-summary.module.css apps/web/src/components/onnuri-summary.test.tsx apps/web/src/components/market-detail.tsx apps/web/src/components/market-explorer.test.tsx 'apps/web/src/app/markets/[slug]/page.tsx' 'apps/web/src/app/markets/[slug]/page.test.tsx'
git commit -m "feat: show onnuri counts on market details"
```

---

### Task 6: 시장별 온누리 검색 문구 적용

**Files:**
- Modify: `apps/web/src/lib/market-seo.ts`
- Modify: `apps/web/src/lib/market-seo.test.ts`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `PublicMarket.onnuri`
- Produces: 기존 `createMarketSeoText(market)` 반환 계약 유지

- [ ] **Step 1: 수치 유무별 SEO 실패 테스트 작성**

```ts
it("가맹점 수가 있는 시장은 온누리 검색 의도를 제목과 설명에 담는다", () => {
  const seo = createMarketSeoText({ ...periodicMarket, onnuri: summary });
  expect(seo.title).toBe("용인 중앙시장 장날·온누리상품권 가맹점 83곳 | 오늘 장날");
  expect(seo.description).toContain("온누리상품권 가맹점 83곳");
  expect(seo.description).toContain("디지털 71곳·지류 65곳");
});

it("집계가 없는 시장은 기존 장날 메타데이터를 유지한다", () => {
  expect(createMarketSeoText({ ...periodicMarket, onnuri: null }).title)
    .toBe("용인 중앙시장 장날 · 5·10일장 | 오늘 장날");
});
```

- [ ] **Step 2: 기존 구현에서 새 기대가 실패하는지 확인**

Run: `pnpm --dir apps/web test -- market-seo.test.ts`

Expected: 첫 테스트 FAIL, 기존 문구 보존 테스트 PASS.

- [ ] **Step 3: 수치가 있을 때만 메타데이터 분기 추가**

장날 패턴은 description에 유지하고 제목 길이를 줄이기 위해 수치가 있는 제목에서는 `5·10일장`을 description으로 내린다. `unknown` 일정은 기존 noindex 정책을 유지하며 온누리 수치가 있어도 indexable로 바꾸지 않는다.

```ts
if (market.onnuri) {
  const count = market.onnuri.totalCount.toLocaleString("ko-KR");
  const digital = market.onnuri.digitalCount.toLocaleString("ko-KR");
  const paper = market.onnuri.paperCount.toLocaleString("ko-KR");
  return {
    title: `${market.name} 장날·온누리상품권 가맹점 ${count}곳 | 오늘 장날`,
    description: `${locationPrefix}${market.name}의 ${formatSchedulePattern(market)}과 온누리상품권 가맹점 ${count}곳, 디지털 ${digital}곳·지류 ${paper}곳, 주소와 주차 정보를 확인하세요.`,
  };
}
```

- [ ] **Step 4: SEO 단위·라우트 테스트와 커밋**

Run: `pnpm --dir apps/web test -- market-seo.test.ts 'src/app/markets/[slug]/page.test.tsx'`

Expected: PASS.

```bash
git add apps/web/src/lib/market-seo.ts apps/web/src/lib/market-seo.test.ts 'apps/web/src/app/markets/[slug]/page.test.tsx'
git commit -m "feat: add onnuri intent to market SEO"
```

---

### Task 7: `/onnuri` 검색 허브 구현

**Files:**
- Create: `apps/web/src/components/onnuri-market-search.tsx`
- Create: `apps/web/src/components/onnuri-market-search.test.tsx`
- Create: `apps/web/src/app/onnuri/page.tsx`
- Create: `apps/web/src/app/onnuri/page.module.css`
- Create: `apps/web/src/app/onnuri/page.test.tsx`

**Interfaces:**
- Consumes: `/data/markets.json` and `PublicMarket.onnuri`
- Produces: `OnnuriMarketSearch(): JSX.Element`
- Produces: static `/onnuri` page metadata and server-rendered top-market links

- [ ] **Step 1: 검색 컴포넌트 실패 테스트 작성**

```tsx
it("시장명과 지역으로 온누리 가맹 시장을 검색한다", async () => {
  render(<OnnuriMarketSearch />);
  await userEvent.type(screen.getByRole("searchbox", { name: "시장명 또는 지역 검색" }), "포천");
  expect(await screen.findByRole("link", { name: /운천전통시장/ })).toHaveAttribute("href", "/markets/운천전통시장-45b640cc");
  expect(screen.getByText("전체 83곳")).toBeInTheDocument();
});
```

fetch fixture에는 수치 있는 시장, `onnuri: null` 시장, 다른 지역 시장을 포함한다. 검색 결과에는 수치 있는 시장만 표시하고 결과가 없으면 `조건에 맞는 온누리상품권 가맹 시장이 없어요`를 보여준다.

- [ ] **Step 2: 검색 컴포넌트 부재로 실패 확인**

Run: `pnpm --dir apps/web test -- onnuri-market-search.test.tsx`

Expected: FAIL with module not found.

- [ ] **Step 3: 정적 JSON 기반 검색 구현**

기존 `MarketExplorer`와 동일하게 React Query로 `/data/markets.json`을 한 번 읽는다. 검색 문자열과 시장명·도로명·지번 주소를 공백 제거 후 소문자로 비교하고, 결과를 `totalCount` 내림차순 후 시장명 오름차순으로 정렬한다. 로딩·오류·빈 상태를 각각 접근 가능한 텍스트로 표시한다.

```ts
const normalizeSearchText = (value: string): string => value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");

const results = markets
  .filter((market) => market.onnuri !== null)
  .filter((market) => normalizeSearchText([
    market.name,
    market.roadAddress ?? "",
    market.lotAddress ?? "",
  ].join(" ")).includes(normalizeSearchText(query)))
  .sort((a, b) => b.onnuri!.totalCount - a.onnuri!.totalCount || a.name.localeCompare(b.name, "ko-KR"));
```

컴포넌트 바깥의 export 함수가 `QueryClientProvider`를 제공해 페이지에서 추가 provider 없이 사용할 수 있게 한다.

- [ ] **Step 4: 허브 페이지 실패 테스트 작성**

```tsx
it("고유 메타데이터와 서버 렌더링된 주요 시장 링크를 제공한다", () => {
  expect(metadata.alternates?.canonical).toBe("/onnuri");
  render(<OnnuriPage />);
  expect(screen.getByRole("heading", { level: 1, name: "온누리상품권 사용처 찾기" })).toBeInTheDocument();
  expect(screen.getByText(/디지털형과 지류형/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /가맹점.*곳/ })).toBeInTheDocument();
});
```

- [ ] **Step 5: 허브 서버 콘텐츠와 스타일 구현**

`publicMarkets.filter(market => market.onnuri !== null)`을 전체 수 내림차순으로 정렬해 상위 12개 시장 링크를 서버 렌더링한다. 페이지에는 데이터 기준일, 디지털형·지류형 설명, 중복 때문에 세 수치가 단순 합계가 아니라는 설명, 공식 확인 링크를 둔다. title은 `온누리상품권 사용처·가맹점 찾기 | 오늘 장날`, description은 시장별 전체·디지털·지류 가맹점 수를 찾을 수 있음을 명시한다.

```ts
export const metadata: Metadata = {
  title: "온누리상품권 사용처·가맹점 찾기 | 오늘 장날",
  description: "전국 전통시장별 온누리상품권 전체·디지털·지류 가맹점 수와 사용처를 찾아보세요.",
  alternates: { canonical: "/onnuri" },
  openGraph: { url: "/onnuri", type: "website" },
};

const featuredMarkets = publicMarkets
  .filter((market) => market.onnuri !== null)
  .sort((a, b) => b.onnuri!.totalCount - a.onnuri!.totalCount)
  .slice(0, 12);
```

- [ ] **Step 6: 허브 테스트와 커밋**

Run: `pnpm --dir apps/web test -- onnuri-market-search.test.tsx 'src/app/onnuri/page.test.tsx'`

Expected: PASS.

```bash
git add apps/web/src/components/onnuri-market-search.tsx apps/web/src/components/onnuri-market-search.test.tsx apps/web/src/app/onnuri
git commit -m "feat: add onnuri market search hub"
```

---

### Task 8: 내부 링크·사이트맵·전체 검증

**Files:**
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/sitemap.ts`
- Modify: `apps/web/src/app/seo-routes.test.ts`

**Interfaces:**
- Consumes: `/onnuri` route from Task 7
- Produces: 홈·시장 상세 내부 링크와 사이트맵 entry

- [ ] **Step 1: 내부 링크와 사이트맵 실패 테스트 작성**

```ts
expect(sitemap()).toContainEqual({
  url: `${SITE_URL}/onnuri`,
  changeFrequency: "monthly",
  priority: 0.9,
});
```

홈 헤더에는 접근 가능한 이름 `온누리상품권` 링크가 `/onnuri`를 가리키는지, 시장 상세에도 같은 허브 링크가 있는지 통합 테스트를 추가한다. 기존 사이트맵 총 길이 기대값은 허브 추가분만큼 1 증가시킨다.

- [ ] **Step 2: 새 링크와 sitemap entry 부재로 실패 확인**

Run: `pnpm --dir apps/web test -- market-explorer.test.tsx 'src/app/markets/[slug]/page.test.tsx' seo-routes.test.ts`

Expected: FAIL on `/onnuri` link and sitemap assertions.

- [ ] **Step 3: 최소 내부 링크와 sitemap entry 구현**

홈 헤더 `header-actions`에 `/onnuri` 링크를 추가하고 모바일에서도 44px에 가까운 터치 영역과 기존 헤더 폭을 유지한다. 정적 시장 상세의 보조 메뉴에도 같은 링크를 추가한다. sitemap의 홈 다음에 `/onnuri`를 배치한다.

```ts
return [
  { url: SITE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${SITE_URL}/onnuri`, changeFrequency: "monthly", priority: 0.9 },
  ...marketEntries,
];
```

- [ ] **Step 4: 전체 자동 검증**

Run: `pnpm test`

Expected: all workspace tests PASS.

Run: `pnpm typecheck`

Expected: exit 0.

Run: `pnpm build`

Expected: Next.js production build succeeds and `/onnuri` plus 1,393 market routes are generated without errors.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 5: 브라우저 수동 검증**

Run: `pnpm dev:web`

Desktop 1440px와 mobile 375px에서 `/onnuri`, 수치가 있는 시장 상세, 수치가 없는 시장 상세를 확인한다. 검색, 빈 상태, 전체·디지털·지류 수, 기준일, 공식 링크, 긴 시장명의 줄바꿈, 가로 스크롤 부재를 검증한다.

- [ ] **Step 6: 최종 커밋**

```bash
git add apps/web/src/components/market-explorer.tsx apps/web/src/components/market-explorer.test.tsx 'apps/web/src/app/markets/[slug]/page.tsx' 'apps/web/src/app/markets/[slug]/page.test.tsx' apps/web/src/app/globals.css apps/web/src/app/sitemap.ts apps/web/src/app/seo-routes.test.ts
git commit -m "feat: connect onnuri discovery routes"
```

---

## Completion Review

- 설계 문서의 데이터 원천, 매칭, 데이터 모델, 두 상세 화면, 허브, SEO, 오류 처리, 테스트 요구사항이 각각 Task 1~8에 대응하는지 확인한다.
- 미완성 표식이나 다른 단계에 구현을 떠넘기는 문구가 없는지 계획 전체를 검색해 확인한다.
- `OnnuriMerchantSummary`의 필드명과 null 계약이 데이터 파이프라인, 웹 타입, UI, SEO에서 모두 동일해야 한다.
- 기존 시장 수 1,393개와 indexable 시장 수 정책이 유지되어야 한다.
- 최종 응답에는 실제 매칭 시장 수, 미매칭·충돌 수, 기준일, 테스트·타입 검사·빌드 결과를 보고한다.
