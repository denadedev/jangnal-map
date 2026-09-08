# 사용자 제보 SMTP 이메일 접수 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 오늘장날 화면에서 시장 정보 오류와 서비스 불편을 제출하면 서버가 Gmail SMTP를 통해 운영자 이메일로 전송한다.

**Architecture:** `/report`는 시장 문맥과 접근 가능한 폼을 제공하고 `/api/report`는 모든 입력을 다시 검증한다. 검증된 제보는 Nodemailer의 Gmail SMTP transport로 일반 텍스트 이메일 한 건을 보내며 별도 데이터베이스에는 저장하지 않는다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 7, Nodemailer, Gmail SMTP, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-09-07-user-report-intake-design.md`

## Global Constraints

- SMTP 자격증명은 서버 환경 변수에서만 읽는다.
- 발신 계정은 Google 2단계 인증과 앱 비밀번호를 사용한다.
- 수신자와 발신자는 서버 설정으로만 결정하며 사용자 입력을 사용하지 않는다.
- 사용자 입력은 일반 텍스트 본문에만 넣는다.
- 제보를 데이터베이스에 저장하지 않는다.
- 연락처는 선택이며 입력한 경우에만 동의를 요구한다.
- 시장 제보의 시장 ID는 서버가 공개 카탈로그로 검증한다.
- 기존 지도와 시장 탐색은 SMTP 설정이나 발송 실패와 무관하게 작동한다.

---

### Task 1: 클라이언트 제보 검증과 API 제출

**Files:**
- Create: `apps/web/src/lib/report.ts`
- Create: `apps/web/src/lib/report.test.ts`
- Create: `apps/web/src/components/report-form.tsx`
- Create: `apps/web/src/components/report-form.test.tsx`

**Interfaces:**
- Produces: `validateReport(values)`, `submitReport(formData)`, `ReportForm`
- Consumes: `/api/report` JSON 응답

- [x] **Step 1: 유형·내용·URL·연락처 동의 검증 실패 테스트 작성**
- [x] **Step 2: 테스트가 구현 부재로 실패하는지 확인**
- [x] **Step 3: `validateReport`의 최소 구현 작성**
- [x] **Step 4: `/api/report` JSON 제출과 429·일반 실패 분류 테스트 작성**
- [x] **Step 5: `submitReport`의 최소 구현 작성**
- [x] **Step 6: 성공·실패·설정 누락·진행 상태와 입력 보존 컴포넌트 테스트 작성**
- [x] **Step 7: 접근 가능한 `ReportForm` 구현 후 테스트 통과 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/report.test.ts src/components/report-form.test.tsx`

Expected: 두 테스트 파일의 모든 테스트 통과.

---

### Task 2: Nodemailer Gmail SMTP 전송

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/web/vercel.json`
- Create: `apps/web/src/lib/report-email.ts`
- Create: `apps/web/src/lib/report-email.test.ts`

**Interfaces:**
- Consumes: `ResolvedReport`, `SMTP_USER`, `SMTP_PASS`, `REPORT_TO_EMAIL`
- Produces: `readSmtpConfig`, `createReportMessage`, `sendReportEmail`

- [x] **Step 1: 자체 TypeScript 선언을 포함한 Nodemailer 의존성 추가**

```bash
pnpm --filter @jangnal-map/web add nodemailer
```

- [x] **Step 2: SMTP 설정 누락과 기본 수신자 테스트 작성**

```ts
expect(readSmtpConfig({ SMTP_USER: "report@gmail.com", SMTP_PASS: "app-password" })).toEqual({
  user: "report@gmail.com",
  pass: "app-password",
  to: "report@gmail.com",
});
```

- [x] **Step 3: 검증된 시장 문맥을 포함한 일반 텍스트 메일 테스트 작성**
- [x] **Step 4: `smtp.gmail.com:465`, TLS와 앱 비밀번호를 사용하는 transport 구현**
- [x] **Step 5: 파일·URL 직접 접근을 차단한 `sendReportEmail` 구현**
- [x] **Step 6: SMTP timeout을 연결·greeting·DNS 5초, socket 10초로 제한**
- [x] **Step 7: timeout 최악 합계 25초보다 긴 route 최대 실행시간 40초와 Vercel 함수 서울 리전 `icn1` 지정**
- [x] **Step 8: 주입한 가짜 transport로 메일 계약 테스트 통과 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/report-email.test.ts`

Expected: 설정, 본문과 전송 테스트 통과.

---

### Task 3: 서버 메일 전송 API

**Files:**
- Create: `apps/web/src/app/api/report/route.ts`
- Create: `apps/web/src/app/api/report/route.test.ts`
- Create: `apps/web/src/lib/report-handler.ts`

**Interfaces:**
- Consumes: 클라이언트 JSON, `publicMarkets`, `sendReportEmail`
- Produces: `POST /api/report`, `createReportHandler(sendReport)`

- [x] **Step 1: 정상 시장 제보가 카탈로그 시장명으로 전달되는 테스트 작성**
- [x] **Step 2: 잘못된 시장 ID가 400이고 메일을 보내지 않는 테스트 작성**
- [x] **Step 3: 다른 Origin 요청이 403인 테스트 작성**
- [x] **Step 4: honeypot 제출이 메일 없이 성공하는 테스트 작성**
- [x] **Step 5: 본문 10,000자 제한, 유형 allowlist와 서버 입력 검증 구현**
- [x] **Step 6: 테스트 가능한 핸들러를 `report-handler.ts`로 분리하고 route에는 허용된 export만 유지**
- [x] **Step 7: SMTP 성공은 200, 실패는 502로 응답하도록 구현**
- [x] **Step 8: API 테스트 통과 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/app/api/report/route.test.ts`

Expected: API 계약 테스트 통과.

---

### Task 4: 제보·개인정보 페이지와 진입점

**Files:**
- Create: `apps/web/src/app/report/page.tsx`
- Create: `apps/web/src/app/report/page.test.tsx`
- Create: `apps/web/src/app/report/page.module.css`
- Create: `apps/web/src/app/privacy/page.tsx`
- Create: `apps/web/src/app/privacy/page.test.tsx`
- Modify: `apps/web/src/components/market-detail.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.module.css`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- Consumes: SMTP 설정 여부와 `ReportForm`
- Produces: `/report`, `/privacy`, 시장·서비스 제보 링크

- [x] **Step 1: 서비스 제보, 유효 시장과 잘못된 시장 페이지 테스트 작성**
- [x] **Step 2: 서버가 시장 ID를 검증하고 SMTP 설정 여부를 폼에 전달하도록 구현**
- [x] **Step 3: 선택 연락처 목적·보유기간과 삭제 요청 이메일 안내 구현**
- [x] **Step 4: 지도 헤더와 시장 상세에 두 종류의 제보 링크 테스트 작성**
- [x] **Step 5: 지도와 시장별 검색 페이지의 링크 구현**
- [x] **Step 6: 44px 이상 터치 영역과 375px 단일 열 폼 스타일 구현**
- [x] **Step 7: 페이지·진입점 테스트 통과 확인**

Run: `pnpm --filter @jangnal-map/web test -- src/app/report/page.test.tsx src/app/privacy/page.test.tsx src/components/market-explorer.test.tsx src/app/markets/'[slug]'/page.test.tsx`

Expected: 페이지와 진입점 테스트 통과.

---

### Task 5: 설정과 운영 문서

**Files:**
- Modify: `apps/web/.env.example`
- Modify: `README.md`
- Modify: `docs/product/정적-MVP-결정.md`
- Create: `docs/product/제보-운영.md`

- [x] **Step 1: `SMTP_USER`, `SMTP_PASS`, `REPORT_TO_EMAIL` 예시 추가**
- [x] **Step 2: Google 2단계 인증과 앱 비밀번호 설정 절차 작성**
- [x] **Step 3: 메일 라벨, 사실 확인, 회신, 90일 삭제와 자격증명 폐기 절차 작성**
- [x] **Step 4: 정적 MVP 결정에 메일 전송 전용 API 예외 기록**

---

### Task 6: 전체 검증과 실제 수신

**Files:**
- Verify only: all changed files

- [x] **Step 1: 전체 테스트 실행**

Run: `pnpm test`

Expected: 모든 workspace 테스트 통과.

- [x] **Step 2: 타입 검사 실행**

Run: `pnpm typecheck`

Expected: TypeScript 오류 없음.

- [x] **Step 3: 프로덕션 빌드 실행**

Run: `pnpm build`

Expected: `/api/report`, `/report`, `/privacy`가 빌드 결과에 나타남.

- [x] **Step 4: 모바일·데스크톱 브라우저 검증**

1. 375px에서 가로 스크롤 없이 유형, 내용, 선택 연락처와 동의를 입력한다.
2. 시장 상세에서 시장 제보 링크와 자동 시장 문맥을 확인한다.
3. 서비스 불편 신고 진입점과 잘못된 시장 안내를 확인한다.
4. 브라우저 콘솔 오류가 없는지 확인한다.

- [ ] **Step 5: 실제 Gmail SMTP 수신 확인**

1. 전용 Google 계정에서 2단계 인증을 활성화한다.
2. 앱 비밀번호를 Vercel `SMTP_PASS`에 직접 저장한다.
3. `SMTP_USER`와 필요 시 `REPORT_TO_EMAIL`을 저장한다.
4. Preview에서 시장 제보와 서비스 불편 신고를 각각 한 건 전송한다.
5. 제목, 시장명·ID, 유형, 내용과 선택 연락처가 운영 이메일에 도착하는지 확인한다.
6. 테스트 메일과 연락처를 삭제한다.

- [ ] **Step 6: Vercel Firewall 요청 제한 게시**

1. Vercel Dashboard에서 프로젝트의 Firewall을 연다.
2. Request Method가 `POST`이고 Request Path가 `/api/report`인 규칙을 만든다.
3. IP 기준 Fixed Window를 선택해 10분당 5건으로 설정한다.
4. 초과 동작을 기본 429로 설정하고 규칙을 게시한다.
5. 여섯 번째 요청이 429이고 폼이 대체 이메일 안내를 표시하는지 확인한다.

- [x] **Step 7: 변경 무결성 확인**

Run: `git diff --check`

Expected: 출력 없이 exit 0.
