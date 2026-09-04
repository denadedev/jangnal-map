# 오늘장날 정적 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 가능한 전통시장 400개를 정적 JSON으로 제공하고 Next.js·NAVER Maps 기반 전국 장날 지도를 Vercel 배포 가능한 상태로 만든다.

**Architecture:** 조사 도구가 EUC-KR 원본 CSV에서 공개 가능한 시장만 `apps/web/public/data/markets.json`으로 생성한다. Next.js 클라이언트는 정적 JSON을 읽고 장날을 계산하며, NAVER Maps Web SDK에는 지도와 사용자 정의 핀만 맡긴다. API·DB·서버 상태는 없다.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, shadcn/ui primitives, TanStack Query, NAVER Maps Web SDK, Vitest, Testing Library, Playwright, pnpm, Vercel Hobby

**Spec:** `docs/product/정적-MVP-결정.md`

## Global Constraints

- 백엔드, 데이터베이스, API route를 만들지 않는다.
- 공개 JSON은 400개 시장만 포함한다.
- 핀은 시장명과 다음 장날을 함께 표시한다.
- `5일+10일`은 날짜 끝자리 5와 0이다.
- 날짜 계산은 월말·윤년·연말을 정확히 처리한다.
- NAVER Maps 키가 없거나 SDK가 실패하면 목록 탐색을 제공한다.
- 원본 CSV는 Git에 추가하지 않는다.
- 사용자 제보 저장 기능은 만들지 않는다.
- 사용자 검증과 명시적 승인 전에는 Vercel에 배포하지 않는다.

---

### Task 1: 공개 시장 JSON 생성

**Files:**
- Create: `work/data-audit/src/generate-public-markets.ts`
- Create: `work/data-audit/test/generate-public-markets.test.ts`
- Modify: `work/data-audit/package.json`
- Create: `apps/web/public/data/markets.json`

**Interfaces:**
- Produces: `generatePublicMarkets(rawRows, normalizedRows): PublicMarket[]`

- [ ] 테스트를 먼저 작성해 fixture에서 게시 가능한 장날만 남고 `5일+10일`이 `[5,0]`이 되는지 확인한다.
- [ ] 실패를 확인한 뒤 생성기를 구현한다.
- [ ] 공식 CSV로 JSON을 생성하고 정확히 400개, 좌표 누락 0, 비정형 규칙 0인지 검사한다.
- [ ] 조사 도구 전체 테스트와 타입 검사를 실행하고 커밋한다.

---

### Task 2: Next.js 기반과 장날 계산

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/lib/market.ts`
- Create: `apps/web/src/lib/schedule.ts`
- Create: `apps/web/src/lib/schedule.test.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: Tailwind/PostCSS 설정 파일

**Interfaces:**
- Produces: `getMarketDates(market, range): Date[]`, `getNextMarketDate(market, from): Date`

- [ ] 날짜 계산 테스트를 먼저 작성한다: 1·6, 5·0, 월말, 윤년, 연말.
- [ ] 실패를 확인한 뒤 최소 날짜 계산을 구현한다.
- [ ] Next.js App Router와 Tailwind 기반을 추가하고 정적 JSON을 로드하는 홈을 만든다.
- [ ] 테스트·타입 검사·production build를 실행하고 커밋한다.

---

### Task 3: 지도·검색·필터·상세 UI

**Files:**
- Create: `apps/web/src/components/market-map.tsx`
- Create: `apps/web/src/components/market-filters.tsx`
- Create: `apps/web/src/components/market-detail.tsx`
- Create: `apps/web/src/components/market-list.tsx`
- Create: `apps/web/src/components/market-explorer.tsx`
- Create: 필요한 `apps/web/src/components/ui/*`
- Create: NAVER Maps 타입·로더 어댑터
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: `PublicMarket[]`, 장날 계산 함수
- Produces: 지도 탐색 → 핀 선택 → 상세정보 흐름

- [ ] 필터와 선택 동작의 컴포넌트 테스트를 먼저 작성한다.
- [ ] URL 검색 파라미터와 TanStack Query로 정적 JSON을 로드한다.
- [ ] NAVER 지도에 `시장명 · M/D` 사용자 정의 핀을 표시한다.
- [ ] 데스크톱 측면 패널과 모바일 하단 상세 영역을 구현한다.
- [ ] 지도 키 누락·SDK 실패·검색 결과 없음의 목록 대체 화면을 구현한다.
- [ ] 접근성 테스트·타입 검사·build를 실행하고 커밋한다.

---

### Task 4: 브라우저 검증과 Vercel 배포 전 준비

**Files:**
- Create: `apps/web/.env.example`
- Create: `README.md`
- Create: `outputs/정적-MVP-검증결과.md`

**Interfaces:**
- Consumes: production build
- Produces: 핵심 사용자 흐름과 배포 설정 검증

- [ ] 로컬 production 서버를 실행하고 NAVER 키가 없는 목록 대체 흐름을 브라우저에서 검증한다.
- [ ] 브라우저에서 검색 → 시장 선택 → 다음 장날·출처 확인을 검증한다.
- [ ] 1440px 데스크톱과 375px 모바일 viewport에서 레이아웃·필터·상세 영역을 확인하고 스크린샷을 남긴다.
- [ ] 기존 테스트, 타입 검사와 production build를 실행한다. 사용자 지시에 따라 새 자동 테스트 파일은 추가하지 않는다.
- [ ] Vercel 설정 파일과 필요한 환경 변수를 문서로 검증하되 배포 명령은 실행하지 않는다.
- [ ] 로컬 검증 결과와 실행 방법을 사용자에게 전달하고 배포 승인을 기다린다.
