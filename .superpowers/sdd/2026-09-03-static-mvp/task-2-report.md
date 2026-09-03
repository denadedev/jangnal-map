# Task 2 구현 보고서 — Next.js 기반과 장날 계산

## 구현 범위

- pnpm workspace에 `apps/web` Next.js 16.3.4 App Router 앱을 추가했다.
- Tailwind CSS 4 PostCSS 설정과 최소 전역 스타일을 추가했다.
- 백엔드, API route, 데이터베이스를 추가하지 않았다. 홈은 정적 `public/data/markets.json`을 타입으로 읽어 400개 시장 수와 예시 데이터를 표시한다.
- `PublicMarket`, `MarketSchedule` 타입과 다음 순수 함수를 제공한다.
  - `getMarketDates(market, range): Date[]`
  - `getNextMarketDate(market, from): Date`
- `0` 일정 끝자리는 10일·20일·30일을 뜻하도록 날짜의 일(day) 끝자리와 비교한다. 범위의 양 끝은 포함하며, `getNextMarketDate`는 `from`이 장날이면 그 날짜를 반환한다.

## 고정 의존성

- Next.js 16.3.4, React/React DOM 19.2.8, Tailwind CSS 4.3.3, Vitest 4.1.11, TypeScript 7.0.2를 `apps/web/package.json`과 루트 `pnpm-lock.yaml`에 고정했다.

## TDD 증거

### RED

`apps/web/src/lib/schedule.test.ts`를 먼저 작성한 뒤, 구현 모듈이 없는 상태에서 아래 명령을 실행했다.

```text
pnpm --filter @jangnal-map/web test -- schedule.test.ts
```

예상한 실패:

```text
FAIL  src/lib/schedule.test.ts
Error: Cannot find module './schedule'
Test Files  1 failed (1)
Tests  no tests
Exit status 1
```

이는 테스트가 아직 존재하지 않는 일정 계산 모듈을 요구해서 발생한 실패다. 테스트는 1·6, 5·0, 2월 말, 윤년 2월 29일, 연말→연초 경계와 시작일 포함 동작을 리터럴 날짜로 검증한다.

### GREEN

최소 구현 뒤 같은 focused 명령을 다시 실행했다.

```text
Test Files  1 passed (1)
Tests  6 passed (6)
Exit status 0
```

## 최종 검증

```text
pnpm test
```

결과:

```text
apps/web: Test Files 1 passed (1), Tests 6 passed (6)
work/data-audit: Test Files 6 passed (6), Tests 25 passed (25)
```

```text
pnpm typecheck
```

결과: 웹 앱과 데이터 감사 도구의 `tsc --noEmit` 모두 종료 코드 0.

```text
pnpm build
```

결과:

```text
Next.js 16.3.4 production build exit code 0
Route (app): / and /_not-found
/ is statically prerendered
```

추가 확인:

- `git diff --check` 통과 (공백 오류 없음)
- 정적 JSON 검사: `{ "count": 400, "firstHasId": true, "invalidSchedules": 0 }`
- `apps/web` 아래 API route 및 런타임 `fetch` 호출 없음

## 변경 파일

- `.gitignore`
- `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`
- `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/next-env.d.ts`, `apps/web/postcss.config.mjs`
- `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`
- `apps/web/src/lib/market.ts`, `apps/web/src/lib/schedule.ts`, `apps/web/src/lib/schedule.test.ts`

## 우려사항

- 장날 규칙은 공개 데이터 계약처럼 `digit-pair`만 받는다. 비정형 주기나 매일 장은 Task 1에서 공개 JSON에서 제외되어 이 함수의 범위 밖이다.
- 로컬 달력 기준으로 계산하므로 날짜 입력은 UI가 사용자 로컬 날짜로 만들도록 유지해야 한다.

## 리뷰 수정 라운드 1 — 재현 가능한 Next 타입 생성

### 원인 확인

`next-env.d.ts`는 Next.js가 생성하는 `.next/types/routes.d.ts`와 `.next/types/root-params.d.ts`를 참조한다. 기존 `typecheck` 스크립트는 `tsc --noEmit`만 실행했으므로, 새 checkout처럼 `.next`가 없는 상태에서 경로 타입을 명시적으로 생성하지 않았다.

참고로 이 환경에서는 아래 재현 명령의 기존 `tsc --noEmit`가 종료 코드 0으로 끝났다. TypeScript가 누락된 `.d.ts` import를 진단하지 않은 것이다. 이는 실패 여부와 관계없이 Next 경로 타입 생성을 생략한다는 구성 결함을 해소하지 못한다.

```text
rm -rf apps/web/.next
pnpm --filter @jangnal-map/web typecheck
```

### 수정

Next.js 16.3.4의 내장 명령을 사용해 웹 앱의 `typecheck`를 다음 순서로 바꿨다.

```text
next typegen && tsc --noEmit
```

`next-env.d.ts`는 Next 프레임워크가 생성한 내용을 그대로 유지했고, 수동 변경하지 않았다. 패키지 스크립트는 동작 산출물이 아니므로 텍스트 검사 테스트는 추가하지 않았다.

### 새 생성 상태 검증

무시된 생성 산출물 `apps/web/.next`만 삭제한 뒤 아래 명령을 실행했다.

```text
rm -rf apps/web/.next && pnpm --filter @jangnal-map/web typecheck
```

결과:

```text
next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
Exit status 0
```

같은 검증 순서에서 실행한 전체 확인 결과:

```text
pnpm test
apps/web: Test Files 1 passed (1), Tests 6 passed (6)
work/data-audit: Test Files 6 passed (6), Tests 25 passed (25)

pnpm build
Next.js 16.3.4 production build exit code 0
/ is statically prerendered
```

마지막으로 `.next`를 다시 삭제한 상태에서 루트 스크립트도 실행했다.

```text
rm -rf apps/web/.next && pnpm typecheck
apps/web: next typegen && tsc --noEmit — Types generated successfully
work/data-audit: tsc --noEmit
Exit status 0
```
