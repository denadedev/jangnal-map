# kmarketday.com 도메인 전환 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `https://kmarketday.com`을 오늘 장날의 단일 canonical 서비스 주소로 전환하고, 기존 `spamfam.kr`과 확인된 레거시 호스트의 유입·SEO·제보 기능을 보존한다.

**Architecture:** `kmarketday.com`은 NPMplus TLS와 기존 Traefik/Next.js 서비스로 전달되어 200을 반환한다. NPMplus는 기존 운영 도메인과 연결된 레거시 호스트의 정확한 301을 담당하고, Next.js는 프록시 우회에 대비한 308 fallback을 유지한다. 애플리케이션의 SEO 기준 URL과 제보 허용 Origin은 `kmarketday.com`으로 바꾸되 Umami 서버 주소 `analytics.spamfam.kr`은 유지한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Playwright, standalone Docker image, K3s/Traefik/NPMplus, Argo CD, Umami, Google Search Console, AdSense.

**Spec:** `docs/superpowers/specs/2026-09-22-kmarketday-domain-migration-design.md`

## Global Constraints

- 공식 서비스 주소는 정확히 `https://kmarketday.com`이며 앱의 `SITE_URL`과 `metadataBase`는 이 값을 사용한다.
- NPMplus에 연결된 `spamfam.kr`과 레거시 호스트는 경로와 쿼리 문자열을 보존해 새 주소로 HTTP 301 이동한다. `jangnal-map.vercel.app`처럼 NPMplus 밖에 있는 호스트는 Next.js fallback의 HTTP 308을 사용하며, 실제 연결 여부를 운영 검증에서 확인한다.
- Next.js `permanent: true`는 308 fallback으로만 사용한다. NPMplus가 연결된 운영 호스트의 정확한 301을 책임진다.
- Umami script URL `https://analytics.spamfam.kr/script.js`와 website ID는 유지하고 `data-domains`만 `kmarketday.com`으로 바꾼다.
- K3s 런타임 `REPORT_ALLOWED_ORIGIN`은 `https://kmarketday.com` 하나로 설정한다. forwarding header는 신뢰하지 않는다.
- 기존 `spamfam.kr` DNS와 라우팅은 새 도메인이 안정화될 때까지 삭제하지 않는다.
- SMTP 자격증명, GitOps 토큰, DNS 계정정보는 저장소·로그·채팅에 기록하지 않는다.
- 기존 `CHANGELOG.md`와 과거 검증 문서는 과거 사실을 보존하며, 새 전환 결과는 별도 검증 문서에 기록한다.

## Review Focus

- **Canonical leakage:** 모든 metadata, JSON-LD, sitemap, robots가 `kmarketday.com`을 사용하고 `spamfam.kr`이 남지 않아야 한다. Task 2의 Vitest·Task 5의 Playwright가 고정한다.
- **Redirect integrity:** 기존 호스트의 대표 경로와 쿼리가 HTTP 301로 새 호스트에 그대로 도착하고 레거시 호스트가 콘텐츠를 200으로 내놓지 않아야 한다. Task 1의 proxy preflight와 Task 6의 curl 검증이 고정한다.
- **Origin enforcement:** 새 canonical Origin은 제보 API를 통과하고 공격자 Origin 및 위조된 forwarding header는 거부되어야 한다. Task 3의 handler/route 테스트와 Task 6의 운영 API 검증이 고정한다.
- **Analytics split:** 분석 script 서버는 `analytics.spamfam.kr`로 유지되지만 수집 대상은 `kmarketday.com`이어야 한다. Task 2의 layout 테스트와 Task 6의 HTML/네트워크 확인이 고정한다.
- **Infrastructure consistency:** DNS, TLS SAN, NPMplus Host rule, Traefik 전달, 런타임 Secret, Argo CD rollout이 같은 canonical 기준을 가져야 한다. Task 1과 Task 5·6의 운영 체크리스트가 고정한다.

## 변경 파일 지도

- `apps/web/src/lib/market-seo.ts`: canonical `SITE_URL`의 단일 소스
- `apps/web/src/app/layout.tsx`: `metadataBase`와 Umami 대상 도메인
- `apps/web/next.config.ts`: `spamfam.kr` 및 레거시 호스트의 Next.js fallback redirect
- `apps/web/src/app/seo-routes.test.ts`: sitemap, robots, metadata, redirect 계약
- `apps/web/src/app/layout.test.tsx`: Umami script 서버/대상 도메인 분리 계약
- `apps/web/src/app/page.test.tsx`: WebSite JSON-LD URL 계약
- `apps/web/src/lib/report-handler.test.ts`: reverse proxy 환경의 Origin 계약
- `apps/web/src/app/api/report/route.test.ts`: 새 public URL 기반 제보 요청 픽스처
- `apps/web/src/lib/report-email.test.ts`: 메일 본문의 제출 URL 픽스처
- `apps/web/e2e/adsense-readiness.spec.ts`: 운영 연결 파일의 canonical URL 계약
- `scripts/create-release.mjs`: Release 본문의 Site URL
- `scripts/create-release.test.mjs`: Release 본문 Site URL 기대값
- `README.md`, `apps/web/README.md`: 운영 주소·환경변수·검증 안내
- `docs/verification/2026-09-22-kmarketday-domain-migration.md`: 실제 배포 후 증적

---

### Task 1: DNS·TLS·프록시 사전 준비

**Files:**
- External: DNS provider, NPMplus, Traefik routing, existing `spamfam.kr` host
- Modify: 없음

**Interfaces:**
- Consumes: 현재 `spamfam.kr`의 DNS 응답과 NPMplus public endpoint
- Produces: `kmarketday.com`이 현재 애플리케이션으로 전달되는 상태, 기존 도메인 서비스 보존

- [ ] **Step 1: 현재 endpoint와 기존 호스트 상태를 기록한다**

```bash
dig +short A spamfam.kr
dig +short AAAA spamfam.kr
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' https://spamfam.kr/
curl -sS -D - -o /dev/null https://spamfam.kr/ | sed -n '1,20p'
```

Expected: 현재 운영 응답이 확인되고, 기존 DNS target과 TLS 응답을 전환 기록에 사용할 수 있다. IP·인증서 값은 저장소에 넣지 않는다.

- [ ] **Step 2: 새 apex DNS와 TLS를 준비한다**

현재 `spamfam.kr`이 사용하는 동일한 public endpoint를 기준으로 `kmarketday.com`의 필요한 A/AAAA 또는 CNAME 레코드를 추가한다. NPMplus에 `kmarketday.com` Host rule과 인증서를 추가하고, 인증서 SAN에 `kmarketday.com`이 포함되는지 확인한다. 기존 `spamfam.kr` Host rule과 TLS는 수정·삭제하지 않는다.

- [ ] **Step 3: 새 도메인을 기존 앱으로 먼저 확인한다**

```bash
dig +short A kmarketday.com
dig +short AAAA kmarketday.com
curl -sS -D /tmp/kmarketday-preflight.headers -o /tmp/kmarketday-preflight.html https://kmarketday.com/
sed -n '1,20p' /tmp/kmarketday-preflight.headers
rg -n '오늘 장날|canonical|spamfam\.kr' /tmp/kmarketday-preflight.html
```

Expected: TLS handshake가 성공하고 `kmarketday.com`이 기존 앱에 도달한다. 이 시점에는 아직 앱 이미지가 old canonical metadata를 반환할 수 있으므로 SEO 전환 완료로 표시하지 않는다.

- [ ] **Step 4: 커밋**

이 단계는 외부 인프라 상태만 변경하므로 저장소 커밋은 만들지 않는다. DNS target, 인증서 발급 시각, Host rule 이름은 운영 전환 기록에만 보관한다.

---

### Task 2: canonical URL·SEO·legacy fallback을 TDD로 전환

**Files:**
- Modify: `apps/web/src/lib/market-seo.ts:9`
- Modify: `apps/web/src/app/layout.tsx:7,49`
- Modify: `apps/web/next.config.ts:7-21`
- Modify: `apps/web/src/app/seo-routes.test.ts`
- Modify: `apps/web/src/app/layout.test.tsx`
- Modify: `apps/web/src/app/page.test.tsx`

**Interfaces:**
- Consumes: 기존 `SITE_URL`, Next.js metadata routes, Next.js host redirect config
- Produces: 모든 앱 생성 absolute URL과 fallback redirect의 기준 `https://kmarketday.com`

- [ ] **Step 1: 새 canonical을 요구하는 실패 테스트를 먼저 작성한다**

`apps/web/src/app/seo-routes.test.ts`에서 robots와 root metadata의 기대값을 다음처럼 바꾼다. 같은 파일의 redirect 테스트에는 `spamfam.kr` 규칙을 추가하고 기존 두 레거시 목적지를 새 URL로 바꾼다.

```ts
expect(robots()).toEqual({
  rules: { userAgent: "*", allow: "/" },
  sitemap: "https://kmarketday.com/sitemap.xml",
  host: "https://kmarketday.com",
});

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

expect(metadata.metadataBase).toEqual(new URL("https://kmarketday.com"));
```

`apps/web/src/app/layout.test.tsx`에서는 script selector의 URL을 그대로 `analytics.spamfam.kr`로 유지하고 `data-domains` 기대값만 `kmarketday.com`으로 바꾼다. `apps/web/src/app/page.test.tsx`의 JSON-LD URL 기대값은 `https://kmarketday.com`으로 바꾼다.

- [ ] **Step 2: 관련 테스트가 old canonical 값 때문에 실패하는지 확인한다**

Run: `pnpm --filter @jangnal-map/web test -- src/app/seo-routes.test.ts src/app/layout.test.tsx src/app/page.test.tsx`

Expected: 기존 `spamfam.kr` 구현과 새 테스트 기대값의 불일치로 FAIL한다. 이 단계에서 source를 먼저 바꾸지 않는다.

- [ ] **Step 3: 최소 source 변경을 적용한다**

```ts
// apps/web/src/lib/market-seo.ts
export const SITE_URL = "https://kmarketday.com";
```

```ts
// apps/web/src/app/layout.tsx
metadataBase: new URL("https://kmarketday.com"),
// ...
data-domains="kmarketday.com"
```

```ts
// apps/web/next.config.ts
{
  source: "/:path*",
  has: [{ type: "host", value: "spamfam.kr" }],
  destination: "https://kmarketday.com/:path*",
  permanent: true,
},
{
  source: "/:path*",
  has: [{ type: "host", value: "jangnal-map.vercel.app" }],
  destination: "https://kmarketday.com/:path*",
  permanent: true,
},
{
  source: "/:path*",
  has: [{ type: "host", value: "jangnal.spamfam.kr" }],
  destination: "https://kmarketday.com/:path*",
  permanent: true,
},
```

`analytics.spamfam.kr/script.js`와 website ID는 수정하지 않는다. 내부 상대 링크와 market path 규칙도 수정하지 않는다.

- [ ] **Step 4: canonical·redirect 테스트를 통과시킨다**

Run: `pnpm --filter @jangnal-map/web test -- src/app/seo-routes.test.ts src/app/layout.test.tsx src/app/page.test.tsx src/app/markets/'[slug]'/page.test.tsx`

Expected: PASS. sitemap 항목 수 33개, `SITE_URL` 기반 market URL, metadataBase, JSON-LD, Umami 대상 도메인, 세 host fallback이 모두 새 기준을 사용한다.

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/lib/market-seo.ts apps/web/src/app/layout.tsx apps/web/next.config.ts \
  apps/web/src/app/seo-routes.test.ts apps/web/src/app/layout.test.tsx apps/web/src/app/page.test.tsx
git commit -m "fix: switch canonical site to kmarketday.com"
```

---

### Task 3: 제보 API와 메일 URL 기준을 전환

**Files:**
- Modify: `apps/web/src/lib/report-handler.test.ts`
- Modify: `apps/web/src/app/api/report/route.test.ts`
- Modify: `apps/web/src/lib/report-email.test.ts`
- External runtime: K3s `jangnal-web-env` Secret의 `REPORT_ALLOWED_ORIGIN`

**Interfaces:**
- Consumes: `createReportHandler`, `REPORT_ALLOWED_ORIGIN`, report email page URL
- Produces: `https://kmarketday.com`에서만 허용되는 제보 흐름과 새 주소가 담긴 운영 메일

- [ ] **Step 1: 테스트 픽스처의 public URL과 허용 Origin을 먼저 바꾼다**

`apps/web/src/lib/report-handler.test.ts`의 두 `vi.stubEnv` 값을 `https://kmarketday.com`으로 바꾸고, forwarding header는 `x-forwarded-host: kmarketday.com`으로 바꾼다. `apps/web/src/app/api/report/route.test.ts`의 `request()` 기본 URL과 모든 `jangnal-map.vercel.app` page URL·Origin을 `https://kmarketday.com`으로 바꾼다. `apps/web/src/lib/report-email.test.ts`의 `report.pageUrl`와 예상 메일 본문도 다음 값을 사용한다.

```ts
pageUrl: "https://kmarketday.com/report?kind=market",
// ...
"제출 화면: https://kmarketday.com/report?kind=market",
```

공격자 Origin `https://example.com`, preview fallback 동작, malformed body, honeypot, SMTP 오류 테스트의 의미는 바꾸지 않는다.

- [ ] **Step 2: 제보 관련 fixture 변경이 기존 보안 계약을 유지하는지 확인한다**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/report-handler.test.ts src/app/api/report/route.test.ts src/lib/report-email.test.ts`

Expected: PASS. 이 작업은 런타임 환경변수와 메일 URL의 테스트 fixture를 새 public domain에 맞추는 작업이므로 구현 파일 `report-handler.ts`와 `report-email.ts`는 수정하지 않는다. 공격자 Origin, forwarding header 위조, malformed body, honeypot, SMTP 오류의 기존 계약은 그대로 통과해야 한다.

- [ ] **Step 3: 런타임 Secret 변경 절차를 준비한다**

K3s의 `jangnal-web-env` Secret에서 값만 다음과 같이 변경한다. Secret 원문은 출력하거나 커밋하지 않는다.

```text
REPORT_ALLOWED_ORIGIN=https://kmarketday.com
```

기존 `SMTP_USER`, `SMTP_PASS`, `REPORT_TO_EMAIL`은 값을 변경하지 않는다. 배포 후 새 도메인의 browser request Origin이 `https://kmarketday.com`인지 확인한다.

- [ ] **Step 4: 제보 테스트를 통과시킨다**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/report-handler.test.ts src/app/api/report/route.test.ts src/lib/report-email.test.ts`

Expected: PASS. 새 Origin은 200 또는 검증된 입력 오류를 받고, 공격자 Origin과 forwarding header 위조는 403이며, 메일 본문에는 새 제출 주소가 포함된다.

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/lib/report-handler.test.ts apps/web/src/app/api/report/route.test.ts apps/web/src/lib/report-email.test.ts
git commit -m "test: align report origin with canonical domain"
```

---

### Task 4: 운영 문서와 Release URL을 갱신

**Files:**
- Modify: `README.md`
- Modify: `apps/web/README.md`
- Modify: `scripts/create-release.mjs:44`
- Modify: `scripts/create-release.test.mjs`

**Interfaces:**
- Consumes: 새 canonical 주소, 기존 K3s/NPMplus 운영 절차, Release API body
- Produces: 실제 운영 상태와 일치하는 문서·Release 안내

- [ ] **Step 1: Release 테스트 기대값을 먼저 갱신한다**

`scripts/create-release.test.mjs`의 성공 테스트에 다음 assertion을 추가한다.

```js
assert.match(body.body, /Site: https:\/\/kmarketday\.com\//);
```

기존 `registry.spamfam.kr/jangnal-map/web:${sha}` assertion은 유지한다. registry 주소는 서비스 도메인이 아니다.

- [ ] **Step 2: Release 테스트가 old Site URL을 고정하고 있음을 확인한다**

Run: `node --test scripts/create-release.test.mjs`

Expected: 새 assertion이 old `jangnal.spamfam.kr` body 때문에 FAIL한다.

- [ ] **Step 3: 운영 URL과 전환 절차를 문서화한다**

`scripts/create-release.mjs`의 Site line을 다음처럼 바꾼다.

```js
'Site: https://kmarketday.com/',
```

`README.md`와 `apps/web/README.md`에서는 공식 서비스 경로와 `REPORT_ALLOWED_ORIGIN`을 `kmarketday.com`으로 갱신하고, `analytics.spamfam.kr`은 분석 script 서버로 유지한다. 다음 운영 사실을 명시한다.

- NPMplus에서 `spamfam.kr` 및 연결된 레거시 호스트를 `kmarketday.com`으로 301한다.
- Next.js의 host redirect는 fallback이며 `permanent: true`로 308을 반환할 수 있다.
- 새 도메인 TLS·Traefik·Argo CD rollout·제보 API를 배포 후 확인한다.
- Search Console 새 속성·sitemap과 AdSense 새 사이트 주소를 확인한다.

과거 `CHANGELOG.md`와 `docs/verification/adsense-readiness-2026-09-21.md`의 기록은 수정하지 않는다.

- [ ] **Step 4: 문서·Release 테스트를 통과시킨다**

Run: `node --test scripts/create-release.test.mjs && rg -n "Site: https://kmarketday.com/|REPORT_ALLOWED_ORIGIN=https://kmarketday.com|서비스 경로.*kmarketday.com" README.md apps/web/README.md scripts/create-release.mjs`

Expected: PASS와 함께 새 운영 주소가 문서·Release에 보이고 registry 주소와 과거 검증 기록은 보존된다.

- [ ] **Step 5: 커밋한다**

```bash
git add README.md apps/web/README.md scripts/create-release.mjs scripts/create-release.test.mjs
git commit -m "docs: document kmarketday.com production URL"
```

---

### Task 5: 전체 로컬 검증과 이미지 smoke test

**Files:**
- Verify: `apps/web/e2e/adsense-readiness.spec.ts`
- Modify: `apps/web/e2e/adsense-readiness.spec.ts`
- Verify: `apps/web/scripts/smoke-container.mjs`

**Interfaces:**
- Consumes: Task 2의 canonical output, Task 3의 runtime Origin behavior
- Produces: main에 올릴 수 있는 테스트·타입·빌드·standalone image

- [ ] **Step 1: E2E canonical expectation을 갱신한다**

`apps/web/e2e/adsense-readiness.spec.ts`에서 robots 기대값을 `https://kmarketday.com/sitemap.xml`로 바꾸고 sitemap이 `spamfam.kr`, `jangnal.spamfam.kr`, `jangnal-map.vercel.app`을 포함하지 않는지 확인한다.

```ts
const robotsText = await robots.text();
expect(robotsText).toContain("https://kmarketday.com/sitemap.xml");
expect(sitemapText).not.toContain("spamfam.kr");
expect(sitemapText).not.toContain("jangnal-map.vercel.app");
```

`smoke-container.mjs`는 로컬 `base`의 Origin을 사용해야 하므로 운영 도메인 문자열을 하드코딩하지 않는다.

- [ ] **Step 2: 전체 단위 테스트와 타입 검사를 실행한다**

Run: `pnpm test`

Expected: 모든 Vitest와 Node test가 PASS한다.

Run: `pnpm typecheck`

Expected: Next.js typegen과 TypeScript 검사 PASS.

- [ ] **Step 3: production build를 실행한다**

Run: `pnpm build`

Expected: standalone Next.js production build가 새 canonical metadata를 생성하며 FAIL하지 않는다.

- [ ] **Step 4: Playwright와 container smoke test를 실행한다**

Run: `pnpm --filter @jangnal-map/web exec playwright test`

Expected: AdSense 연결 파일, reviewed/unreviewed route, 모바일·보조 화면 회귀 테스트 PASS.

Run: `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID="$NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID" -t jangnal-web:local .`

Expected: standalone image build PASS.

Run: `docker run --rm -d --name jangnal-web-smoke -p 127.0.0.1:3100:3000 -e REPORT_ALLOWED_ORIGIN=http://127.0.0.1:3100 -e SMTP_USER=runtime-smoke@example.invalid -e SMTP_PASS=not-a-real-password -e REPORT_TO_EMAIL=runtime-smoke@example.invalid jangnal-web:local`

Run: `node apps/web/scripts/smoke-container.mjs`

Expected: 페이지·자산·sitemap·robots·404·API Origin rejection/acceptance PASS.

Run: `docker stop jangnal-web-smoke`

Expected: smoke container가 정리되고 포트 3100이 해제된다.

- [ ] **Step 5: 변경 내용을 검토하고 커밋한다**

```bash
git diff --check
git status --short
git log --oneline -5
```

Expected: 도메인 전환과 관련된 파일만 변경되고 SMTP·registry·과거 검증 기록이 불필요하게 수정되지 않는다. 이전 Task 커밋들이 모두 존재해야 한다.

```bash
git add apps/web/e2e/adsense-readiness.spec.ts
git commit -m "test: update canonical domain e2e checks"
```

---

### Task 6: 배포·canonical 전환·운영 redirect 적용

**Files:**
- External: GitHub Actions, Harbor, GitOps repository, Argo CD Application `jangnal-map`, K3s Secret, NPMplus
- Verify: deployed image and public hosts

**Interfaces:**
- Consumes: Task 5의 통과한 commit/image, Task 1의 new Host/TLS readiness
- Produces: 새 도메인 200, 기존 운영 호스트 301, 새 runtime Origin

- [ ] **Step 1: main 배포 파이프라인을 실행한다**

PR을 병합하거나 승인된 main push를 진행한다. CI가 `pnpm test`, `pnpm typecheck`, Docker build, local smoke test를 통과한 동일 SHA를 Harbor에 게시하고 GitOps image SHA를 갱신하는지 확인한다. GitHub Release의 Site line이 `https://kmarketday.com/`인지 확인한다.

- [ ] **Step 2: K3s runtime Secret을 새 Origin으로 반영한다**

`jangnal-web-env`에 `REPORT_ALLOWED_ORIGIN=https://kmarketday.com`을 반영하고, 기존 SMTP 값은 건드리지 않는다. Argo CD의 `jangnal-map` Application이 새 image와 Secret 변경을 Sync했는지 확인한다.

- [ ] **Step 3: 새 도메인의 애플리케이션을 먼저 검증한다**

```bash
curl -sS -D /tmp/kmarketday.headers -o /tmp/kmarketday.html https://kmarketday.com/
sed -n '1,20p' /tmp/kmarketday.headers
rg -n 'canonical|kmarketday\.com|spamfam\.kr|analytics\.spamfam\.kr' /tmp/kmarketday.html
```

Expected: `kmarketday.com`은 200이며 rendered metadata에는 `kmarketday.com` canonical/JSON-LD/OG URL이 나타난다. Umami script source만 `analytics.spamfam.kr`로 남는다.

- [ ] **Step 4: NPMplus의 기존 호스트 301을 켠다**

새 도메인 200과 제보·SEO 검증이 통과한 뒤 NPMplus에서 `spamfam.kr`과 실제 연결된 `jangnal.spamfam.kr`의 redirect rule을 활성화한다. `jangnal-map.vercel.app`은 Next.js fallback이 적용되므로 Vercel host가 실제로 남아 있는지 확인하고, 연결된 경우 동일한 새 목적지를 유지한다. redirect rule은 application route보다 먼저 평가한다.

- [ ] **Step 5: path/query 보존과 301을 확인한다**

```bash
for host in spamfam.kr jangnal.spamfam.kr; do
  curl -sS -D - -o /dev/null "https://${host}/report?kind=service&from=legacy" | sed -n '1,12p'
done
```

Expected for every connected old host: status is exactly `301`, `Location` is `https://kmarketday.com/report?kind=service&from=legacy`, and the old host does not return the app HTML with status 200. A host that has no DNS/route is recorded as “not connected” rather than invented or silently marked passed.

- [ ] **Step 6: 커밋·배포 상태를 증적에 남긴다**

`git rev-parse HEAD`, GitHub Actions run URL, Harbor image SHA, GitOps commit SHA, Argo CD sync/health 시각을 별도 검증 문서에 기록한다. 토큰·Secret 값은 기록하지 않는다.

---

### Task 7: 운영 기능·SEO·외부 콘솔 검증과 전환 문서화

**Files:**
- Create: `docs/verification/2026-09-22-kmarketday-domain-migration.md`
- External: Search Console, AdSense, Umami, NPMplus, Argo CD

**Interfaces:**
- Consumes: deployed `kmarketday.com`, Task 6 redirect evidence, existing AdSense/SEO rules
- Produces: 재현 가능한 전환 완료 기록과 미완료 외부 항목의 명시적 상태

- [ ] **Step 1: HTTP·TLS·route 체크를 실행한다**

```bash
for path in / /about /onnuri /report /privacy /ads.txt /robots.txt /sitemap.xml /this-page-does-not-exist; do
  curl -sS -o /dev/null -w "%{http_code} %{url_effective} ${path}\n" "https://kmarketday.com${path}"
done
curl -sS https://kmarketday.com/robots.txt
curl -sS https://kmarketday.com/sitemap.xml | rg -o 'https://[^<]+' | sed -n '1,5p'
```

Expected: public pages and connection files are 200, the intentional missing route is 404, robots/sitemap URLs use `kmarketday.com`, and no sitemap URL contains a legacy host.

- [ ] **Step 2: metadata·analytics·AdSense absence를 확인한다**

대표 페이지의 rendered HTML에서 `canonical`, `og:url`, JSON-LD WebSite URL을 확인하고, `spamfam.kr`이 남지 않았는지 검색한다. `analytics.spamfam.kr/script.js`가 로드되고 `data-domains="kmarketday.com"`인지 확인한다. `pagead2.googlesyndication.com`, `ins.adsbygoogle`, Google ad iframe이 없어야 한다.

- [ ] **Step 3: 제보 API의 허용·거부 동작을 확인한다**

브라우저 개발자 도구 또는 동일한 HTTPS 환경에서 `Origin: https://kmarketday.com` 제보 요청을 honeypot payload로 보내 200을 확인한다. `Origin: https://attacker.invalid`와 `Origin: https://localhost:3000` 요청은 403이어야 하며 메일은 발송되지 않는다. forwarding header만 새 도메인을 주장하는 요청도 403이어야 한다. 실제 운영 메일을 보내는 테스트는 별도 명시적 승인 없이는 수행하지 않는다.

- [ ] **Step 4: Umami와 Google 콘솔을 갱신한다**

Umami에서 새 호스트 수집 대상이 `kmarketday.com`으로 인식되는지 확인한다. Google Search Console에 `https://kmarketday.com` 속성을 추가·검증하고 `https://kmarketday.com/sitemap.xml`을 제출한다. AdSense 사이트 목록·연결 상태와 `https://kmarketday.com/ads.txt`를 확인한다. 기존 `spamfam.kr` 속성·sitemap은 새 주소 색인 상태가 확인될 때까지 삭제하지 않는다.

- [ ] **Step 5: 검증 문서를 실제 결과로 작성한다**

`docs/verification/2026-09-22-kmarketday-domain-migration.md`를 만들고 제목을 `kmarketday.com 도메인 전환 검증`으로 작성한다. 문서에는 `git rev-parse HEAD`의 실제 commit, `Asia/Seoul` 기준 실제 검증 시각, 공식 URL `https://kmarketday.com`, 기존 주소의 301 정책을 기록한다. 다음 각 항목은 실제 결과와 실행 증거를 함께 기록하고, 확인하지 못한 항목은 PASS로 표시하지 않는다: DNS/TLS/NPMplus, 새 도메인 주요 경로, canonical/OG/JSON-LD, robots/sitemap/ads.txt, 제보 Origin 허용·거부, Umami 대상 도메인, Argo CD rollout, Search Console, AdSense.

- [ ] **Step 6: 최종 운영 회귀를 완료한다**

Run: `pnpm test && pnpm typecheck && pnpm build && pnpm --filter @jangnal-map/web exec playwright test`

Expected: 코드 검증이 재현 가능하게 PASS하고, Task 6·7의 외부 검증 문서와 실제 배포 SHA가 일치한다.

- [ ] **Step 7: 검증 문서를 커밋한다**

```bash
git add docs/verification/2026-09-22-kmarketday-domain-migration.md
git commit -m "docs: record kmarketday.com domain migration"
```

---

## 최종 실행 순서

1. Task 1에서 `kmarketday.com` DNS/TLS/NPMplus 전달을 준비한다.
2. Task 2에서 canonical·SEO·fallback redirect를 테스트 우선으로 변경한다.
3. Task 3에서 제보 Origin과 메일 URL fixture를 변경한다.
4. Task 4에서 운영 문서와 Release Site URL을 갱신한다.
5. Task 5에서 전체 테스트·타입·build·Playwright·container smoke를 통과시킨다.
6. Task 6에서 main 배포, K3s Secret, 새 도메인 200, 기존 호스트 301을 순서대로 적용한다.
7. Task 7에서 운영 기능·SEO·분석·외부 콘솔을 검증하고 증적 문서를 커밋한다.

## 롤백 기준

- 새 도메인 200·TLS·route가 깨지면 NPMplus/DNS 설정을 먼저 수정하고 기존 `spamfam.kr` route는 유지한다.
- 새 image 또는 Secret 반영 후 앱 기능이 깨지면 GitOps image SHA를 검증된 이전 SHA로 되돌리고 Argo CD health를 확인한다.
- `spamfam.kr` 301을 켠 뒤 새 도메인이 정상 동작하지 않으면 NPMplus redirect rule을 일시 중지하고 기존 서비스 route를 복구한다. DNS 레코드와 기존 TLS는 삭제하지 않는다.
- Search Console·AdSense의 색인/검증 지연은 애플리케이션 rollback 조건이 아니다. 실제 HTTP·canonical·제보 기능이 실패할 때만 배포 rollback을 검토한다.
