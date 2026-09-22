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
- 전환 중 K3s 런타임 `REPORT_ALLOWED_ORIGINS`는 `https://spamfam.kr,https://kmarketday.com` 두 값만 허용하고, 안정화 후 `https://kmarketday.com` 하나로 축소한다. forwarding header는 신뢰하지 않는다.
- 네이버 지도 SDK endpoint와 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`는 유지하고, 네이버 Maps 애플리케이션의 허용 웹 서비스 URL에 `https://kmarketday.com`을 추가한다. 기존 `https://spamfam.kr`은 전환 기간 동안 유지한다.
- 기존 `spamfam.kr` DNS와 라우팅은 새 도메인이 안정화될 때까지 삭제하지 않는다.
- SMTP 자격증명, GitOps 토큰, DNS 계정정보는 저장소·로그·채팅에 기록하지 않는다.
- 기존 `CHANGELOG.md`와 과거 검증 문서는 과거 사실을 보존하며, 새 전환 결과는 별도 검증 문서에 기록한다.

## Review Focus

- **Canonical leakage:** 모든 metadata, JSON-LD, sitemap, robots가 `kmarketday.com`을 사용하고 `spamfam.kr`이 남지 않아야 한다. Task 2의 Vitest·Task 5의 Playwright가 고정한다.
- **Redirect integrity:** 기존 호스트의 대표 경로와 쿼리가 HTTP 301로 새 호스트에 그대로 도착하고 레거시 호스트가 콘텐츠를 200으로 내놓지 않아야 한다. Task 1의 proxy preflight와 Task 6의 curl 검증이 고정한다.
- **Origin enforcement:** 전환 중 새·기존 Origin은 제보 API를 통과하고 공격자 Origin 및 위조된 forwarding header는 거부되며, 안정화 후 기존 Origin은 제거되어야 한다. Task 3과 Task 6·7이 고정한다.
- **Analytics split:** 분석 script 서버는 `analytics.spamfam.kr`로 유지되지만 수집 대상은 `kmarketday.com`이어야 한다. Task 2의 layout 테스트와 Task 6의 HTML/네트워크 확인이 고정한다.
- **Infrastructure consistency:** DNS, TLS SAN, NPMplus Host rule, GitOps Ingress/IngressRoute, Traefik 전달, 런타임 Secret, Argo CD rollout, 네이버 Maps 허용 도메인이 같은 canonical 기준을 가져야 한다. Task 1·1A와 Task 5·6의 운영 체크리스트가 고정한다.

## 변경 파일 지도

- `apps/web/src/lib/market-seo.ts`: canonical `SITE_URL`의 단일 소스
- `apps/web/src/app/layout.tsx`: `metadataBase`와 Umami 대상 도메인
- `apps/web/next.config.ts`: `spamfam.kr` 및 레거시 호스트의 Next.js fallback redirect
- `apps/web/src/lib/report-handler.ts`: 쉼표 구분 Origin allowlist와 기존 단일 변수 fallback
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
- 별도 `denadedev/gitops` 저장소의 실제 `Ingress` 또는 `IngressRoute` manifest: 새 Host/TLS 대상과 기존 Host 유지
- 네이버 클라우드 플랫폼 Maps 애플리케이션: 새 웹 서비스 URL 허용, 기존 도메인 유지
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

### Task 1A: GitOps Ingress/IngressRoute에 새 Host 추가

**Files:**
- External Modify: 별도 `denadedev/gitops` 저장소의 `apps/jangnal-map/` 아래 실제 `Ingress` 또는 Traefik `IngressRoute` manifest
- Verify: 동일 web Service, 포트, TLS resolver/secret, Argo CD Application `jangnal-map`

**Interfaces:**
- Consumes: Task 1의 `kmarketday.com` DNS/TLS 준비, 현재 GitOps route와 Service 대상
- Produces: `kmarketday.com` 요청이 기존 Next.js Service/포트로 전달되는 GitOps 선언

- [ ] **Step 1: Ingress 리소스 종류와 파일을 확인한다**

별도 GitOps 저장소의 root에서 다음을 실행한다.

```bash
rg -n -i "kind: (Ingress|IngressRoute)|spamfam\\.kr|Host\\(|jangnal-map|web" apps/jangnal-map
git status --short
```

Expected: 실제 리소스 kind, 파일 경로, 대상 Service 이름·포트, TLS 종료 위치가 확인된다. 현재 앱 저장소에 없는 파일 경로를 새로 추측해 만들지 않는다.

- [ ] **Step 2: Kubernetes Ingress인 경우 Host와 TLS hosts를 추가한다**

기존 Service backend를 그대로 둔 채 `spec.rules`에 다음 host를 추가하고, 기존 `spamfam.kr` rule을 삭제하지 않는다.

```yaml
spec:
  rules:
    - host: spamfam.kr
      # 기존 http paths와 같은 Service/port 유지
    - host: kmarketday.com
      # 기존 http paths와 같은 Service/port 사용
```

Traefik 또는 cert-manager가 Ingress TLS를 직접 처리하는 경우에만 같은 TLS 항목의 `hosts`에 `kmarketday.com`을 추가한다. TLS를 NPMplus에서만 종료하면 Ingress TLS secret을 임의로 바꾸지 않는다.

- [ ] **Step 3: Traefik IngressRoute인 경우 Host match와 TLS를 추가한다**

기존 route의 Service/port와 middleware를 유지하고 match를 다음 논리로 확장한다.

```yaml
match: Host(`spamfam.kr`) || Host(`kmarketday.com`)
```

기존 match에 path 조건이나 다른 host가 있으면 그 조건을 보존한 채 host 조건만 확장한다. `kmarketday.com`을 별도 Service로 보내거나 Deployment image·port를 바꾸지 않는다. Traefik TLS termination이 실제로 사용될 때만 기존 resolver 또는 secret에 새 host를 추가한다.

- [ ] **Step 4: GitOps manifest와 route diff를 검증한다**

```bash
git diff --check
git diff -- apps/jangnal-map
```

Expected: 새 host가 동일 Service/포트로 향하고, 기존 `spamfam.kr` host와 TLS 경로가 보존되며, unrelated manifest 변경이 없다. 클러스터 접근이 가능하면 해당 manifest에 `kubectl diff` 또는 server-side dry-run을 실행하고, 불가능하면 Argo CD sync 전에 YAML/CRD schema 검증 결과를 남긴다.

- [ ] **Step 5: GitOps 변경을 별도 커밋/PR로 반영한다**

```bash
git add apps/jangnal-map
git commit -m "feat: route jangnal web on kmarketday.com"
git push origin HEAD:main
```

GitOps 저장소의 협업 절차가 PR인 경우 직접 main push 대신 PR을 만들고 병합 승인을 받는다. 앱 저장소의 `scripts/update-gitops-image.mjs`가 관리하는 Deployment image line은 도메인 변경과 무관하므로 수동으로 수정하지 않는다.

---

### Task 2: canonical URL·SEO·legacy fallback을 TDD로 전환

**Files:**
- Create: `apps/web/src/lib/site-config.ts`
- Create: `apps/web/src/lib/site-config.test.ts`
- Modify: `apps/web/src/lib/market-seo.ts:1-9`
- Modify: `apps/web/src/app/layout.tsx:1-7,49`
- Modify: `apps/web/next.config.ts:7-21`
- Modify: `apps/web/src/app/seo-routes.test.ts`
- Modify: `apps/web/src/app/layout.test.tsx`
- Modify: `apps/web/src/app/page.test.tsx`

**Interfaces:**
- Consumes: 기존 `SITE_URL`, Next.js metadata routes, Next.js host redirect config
- Produces: 모든 앱 생성 absolute URL과 fallback redirect의 기준 `https://kmarketday.com`

- [ ] **Step 1: 공통 site config와 새 canonical을 요구하는 실패 테스트를 먼저 작성한다**

`apps/web/src/lib/site-config.test.ts`를 만들고 다음 계약을 고정한다.

```ts
expect(SITE_URL).toBe("https://kmarketday.com");
expect(SITE_HOST).toBe("kmarketday.com");
```

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

Run: `pnpm --filter @jangnal-map/web test -- src/lib/site-config.test.ts src/app/seo-routes.test.ts src/app/layout.test.tsx src/app/page.test.tsx`

Expected: 기존 `spamfam.kr` 구현과 새 테스트 기대값의 불일치로 FAIL한다. 이 단계에서 source를 먼저 바꾸지 않는다.

- [ ] **Step 3: 최소 source 변경을 적용한다**

```ts
// apps/web/src/lib/site-config.ts
export const SITE_URL = "https://kmarketday.com";
export const SITE_HOST = new URL(SITE_URL).hostname;
```

```ts
// apps/web/src/lib/market-seo.ts
import { SITE_URL } from "./site-config";
export { SITE_URL } from "./site-config";
```

```ts
// apps/web/src/app/layout.tsx
import { SITE_HOST, SITE_URL } from "../lib/site-config";
// ...
metadataBase: new URL(SITE_URL),
// ...
data-domains={SITE_HOST}
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

Run: `pnpm --filter @jangnal-map/web test -- src/lib/site-config.test.ts src/app/seo-routes.test.ts src/app/layout.test.tsx src/app/page.test.tsx src/app/markets/'[slug]'/page.test.tsx`

Expected: PASS. sitemap 항목 수 33개, `SITE_URL` 기반 market URL, metadataBase, JSON-LD, Umami 대상 도메인, 세 host fallback이 모두 새 기준을 사용한다.

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/lib/site-config.ts apps/web/src/lib/site-config.test.ts apps/web/src/lib/market-seo.ts \
  apps/web/src/app/layout.tsx apps/web/next.config.ts apps/web/src/app/seo-routes.test.ts \
  apps/web/src/app/layout.test.tsx apps/web/src/app/page.test.tsx
git commit -m "fix: switch canonical site to kmarketday.com"
```

---

### Task 3: 제보 API와 메일 URL 기준을 전환

**Files:**
- Modify: `apps/web/src/lib/report-handler.ts`
- Modify: `apps/web/src/lib/report-handler.test.ts`
- Modify: `apps/web/src/app/api/report/route.test.ts`
- Modify: `apps/web/src/lib/report-email.test.ts`
- External runtime: K3s `jangnal-web-env` Secret의 `REPORT_ALLOWED_ORIGINS`

**Interfaces:**
- Consumes: `createReportHandler`, `REPORT_ALLOWED_ORIGINS`, legacy `REPORT_ALLOWED_ORIGIN` fallback, report email page URL
- Produces: 전환 중 두 canonical Origin을 제한적으로 허용하고 안정화 후 새 Origin만 남기는 제보 흐름과 새 주소가 담긴 운영 메일

- [ ] **Step 1: dual-origin allowlist 실패 테스트를 먼저 작성한다**

`apps/web/src/lib/report-handler.test.ts`는 `REPORT_ALLOWED_ORIGINS="https://spamfam.kr,https://kmarketday.com"`에서 두 Origin을 각각 허용하고, 공격자 Origin과 forwarding header 위조를 계속 거부하는 테스트를 추가한다. 기존 `REPORT_ALLOWED_ORIGIN` 단일 변수 fallback이 preview에서 계속 동작하는 테스트도 유지한다. 빈 목록·잘못된 URL·허용되지 않은 protocol이 들어오면 500과 설정 오류 로그가 나오고 mail transport를 호출하지 않는 테스트를 추가한다. `apps/web/src/app/api/report/route.test.ts`의 `request()` 기본 URL과 새 도메인 page URL·Origin을 `https://kmarketday.com`으로 바꾸고, 기존 Origin을 보낸 제보가 전환 중 통과하는 테스트를 추가한다. `apps/web/src/lib/report-email.test.ts`의 `report.pageUrl`와 예상 메일 본문은 새 주소를 사용한다.

```ts
pageUrl: "https://kmarketday.com/report?kind=market",
// ...
"제출 화면: https://kmarketday.com/report?kind=market",
```

공격자 Origin `https://example.com`, forwarding header만 신뢰 도메인을 주장하는 요청, preview fallback 동작, malformed body, honeypot, SMTP 오류 테스트의 의미는 바꾸지 않는다. 새 테스트는 `https://spamfam.kr`과 `https://kmarketday.com`을 각각 허용하고, `https://spamfam.kr, https://kmarketday.com`처럼 공백이 섞인 설정도 trim 후 처리되는지 고정한다.

- [ ] **Step 2: 새 allowlist 동작이 구현 전 실패하는지 확인한다**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/report-handler.test.ts src/app/api/report/route.test.ts src/lib/report-email.test.ts`

Expected: FAIL because `report-handler.ts` only reads the single-origin configuration and does not yet recognize `REPORT_ALLOWED_ORIGINS`.

- [ ] **Step 3: 최소 allowlist 파싱을 구현한다**

`apps/web/src/lib/report-handler.ts`의 Origin guard를 다음 동작으로 바꾼다.

```ts
const configuredOrigins = process.env.REPORT_ALLOWED_ORIGINS?.trim()
  || process.env.REPORT_ALLOWED_ORIGIN?.trim();
let allowedOrigins: string[];
try {
  allowedOrigins = configuredOrigins
    ? parseReportOrigins(configuredOrigins)
    : [new URL(request.url).origin];
} catch {
  console.error("Invalid report origin configuration");
  return json(500, "제보 설정을 확인해 주세요.");
}
if (!origin || !allowedOrigins.includes(origin)) {
  return json(403, "허용되지 않은 요청입니다.");
}
```

`parseReportOrigins`는 같은 파일의 순수 helper로 두고 다음 계약을 구현한다.

```ts
function parseReportOrigins(value: string): string[] {
  const entries = value.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (entries.length === 0) throw new Error("empty report origins");

  const origins = entries.map((entry) => {
    const url = new URL(entry);
    if (
      !["http:", "https:"].includes(url.protocol)
      || url.pathname !== "/"
      || url.search
      || url.hash
      || url.username
      || url.password
    ) throw new Error("invalid report origin");
    return url.origin;
  });

  const uniqueOrigins = [...new Set(origins)];
  if (uniqueOrigins.length === 0) throw new Error("empty report origins");
  return uniqueOrigins;
}
```

빈 결과, path/query/hash가 붙은 값, 지원하지 않는 protocol, credential이 있는 값은 예외로 처리한다. Forwarding header는 계속 읽지 않고 wildcard matching도 추가하지 않는다. 설정 원문은 로그에 남기지 않는다.

- [ ] **Step 4: 구현 후 제보 테스트를 통과시킨다**

Run: `pnpm --filter @jangnal-map/web test -- src/lib/report-handler.test.ts src/app/api/report/route.test.ts src/lib/report-email.test.ts`

Expected: PASS. 새·기존 Origin은 200 또는 검증된 입력 오류를 받고, 공격자 Origin과 forwarding header 위조는 403이며, 잘못된 설정은 500과 설정 오류 로그를 내고 mail transport를 호출하지 않으며, 메일 본문에는 새 제출 주소가 포함된다.

- [ ] **Step 5: 런타임 Secret 변경 절차를 준비한다**

K3s의 `jangnal-web-env` Secret에서 값만 다음과 같이 변경한다. Secret 원문은 출력하거나 커밋하지 않는다.

```text
REPORT_ALLOWED_ORIGINS=https://spamfam.kr,https://kmarketday.com
```

기존 `SMTP_USER`, `SMTP_PASS`, `REPORT_TO_EMAIL`은 값을 변경하지 않는다. 배포 후 새 도메인의 browser request Origin이 `https://kmarketday.com`인지 확인한다.

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/lib/report-handler.ts apps/web/src/lib/report-handler.test.ts apps/web/src/app/api/report/route.test.ts apps/web/src/lib/report-email.test.ts
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

`README.md`와 `apps/web/README.md`에서는 공식 서비스 경로와 `REPORT_ALLOWED_ORIGINS`의 전환·안정화 값을 갱신하고, 기존 단일 `REPORT_ALLOWED_ORIGIN`은 preview fallback으로 설명한다. `analytics.spamfam.kr`은 분석 script 서버로 유지한다. 다음 운영 사실을 명시한다.

- NPMplus에서 `spamfam.kr` 및 연결된 레거시 호스트를 `kmarketday.com`으로 301한다.
- Next.js의 host redirect는 fallback이며 `permanent: true`로 308을 반환할 수 있다.
- 새 도메인 TLS·Traefik·Argo CD rollout·제보 API를 배포 후 확인한다.
- Search Console 새 속성·sitemap과 AdSense 새 사이트 주소를 확인한다.

과거 `CHANGELOG.md`와 `docs/verification/adsense-readiness-2026-09-21.md`의 기록은 수정하지 않는다.

- [ ] **Step 4: 문서·Release 테스트를 통과시킨다**

Run: `node --test scripts/create-release.test.mjs && rg -n "Site: https://kmarketday.com/|REPORT_ALLOWED_ORIGINS=https://spamfam\.kr,https://kmarketday\.com|서비스 경로.*kmarketday.com" README.md apps/web/README.md scripts/create-release.mjs`

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
- External: GitHub Actions, Harbor, GitOps repository, GitOps Ingress/IngressRoute, Argo CD Application `jangnal-map`, K3s Secret, NPMplus
- Verify: deployed image and public hosts

**Interfaces:**
- Consumes: Task 5의 통과한 commit/image, Task 1의 new Host/TLS readiness
- Produces: 새 도메인 200, 기존 운영 호스트 301, 새 runtime Origin

- [ ] **Step 1: main 배포 파이프라인을 실행한다**

PR을 병합하거나 승인된 main push를 진행한다. CI가 `pnpm test`, `pnpm typecheck`, Docker build, local smoke test를 통과한 동일 SHA를 Harbor에 게시하고 GitOps image SHA를 갱신하는지 확인한다. GitHub Release의 Site line이 `https://kmarketday.com/`인지 확인한다.

- [ ] **Step 2: K3s runtime Secret을 새 Origin으로 반영한다**

`jangnal-web-env`에 전환 중 값인 `REPORT_ALLOWED_ORIGINS=https://spamfam.kr,https://kmarketday.com`을 반영하고, 기존 SMTP 값은 건드리지 않는다. Argo CD의 `jangnal-map` Application이 새 image와 Secret 변경을 Sync했는지 확인한다.

`kmarketday.com` Host가 같은 web Service로 전달되는지 Ingress/IngressRoute status와 Argo CD diff에서 확인한다. 새 host용 TLS secret 또는 resolver가 필요한 구조라면 인증서 Ready 상태도 확인한다.

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

이 검사는 별도 production smoke script를 추가하지 않고 전환 당일 curl 결과를 검증 문서에 보관한다. CI는 로컬 `127.0.0.1:3100`만 검사하며, 실제 DNS/NPMplus 응답은 이 수동 운영 체크의 책임으로 둔다.

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

유효한 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`가 포함된 운영 build에서 네이버 지도 SDK가 `https://kmarketday.com`에서 로드되는지 확인한다. 지도·마커·현재 위치 버튼이 동작하고, SDK 오류 시 기존 목록 fallback이 표시되어야 한다. SDK의 도메인 제한 오류가 있으면 코드나 Client ID를 바꾸기 전에 네이버 Maps 애플리케이션의 웹 서비스 URL 허용 목록을 확인한다.

- [ ] **Step 3: 제보 API의 허용·거부 동작을 확인한다**

브라우저 개발자 도구 또는 동일한 HTTPS 환경에서 `Origin: https://kmarketday.com` 제보 요청을 honeypot payload로 보내 200을 확인한다. `Origin: https://attacker.invalid`와 `Origin: https://localhost:3000` 요청은 403이어야 하며 메일은 발송되지 않는다. forwarding header만 새 도메인을 주장하는 요청도 403이어야 한다. 실제 운영 메일을 보내는 테스트는 별도 명시적 승인 없이는 수행하지 않는다.

- [ ] **Step 4: old Origin을 제거한다**

NPMplus의 `spamfam.kr` 301, 새 도메인 제보, Search Console·Umami·네이버 지도 검증이 안정화된 뒤 K3s Secret을 다음 값으로 축소하고 Argo CD rollout을 확인한다.

```text
REPORT_ALLOWED_ORIGINS=https://kmarketday.com
```

그 다음 `Origin: https://spamfam.kr` 요청은 403, `Origin: https://kmarketday.com` 요청은 통과해야 한다. 이 단계 전에는 기존 Origin을 제거하지 않는다.

- [ ] **Step 5: Umami와 Google 콘솔을 갱신한다**

Umami에서 새 호스트 수집 대상이 `kmarketday.com`으로 인식되는지 확인한다. Google Search Console에 `https://kmarketday.com` 속성을 추가·검증하고 `https://kmarketday.com/sitemap.xml`을 제출한다. AdSense 사이트 목록·연결 상태와 `https://kmarketday.com/ads.txt`를 확인한다. 기존 `spamfam.kr` 속성·sitemap은 새 주소 색인 상태가 확인될 때까지 삭제하지 않는다.

- [ ] **Step 6: 검증 문서를 실제 결과로 작성한다**

`docs/verification/2026-09-22-kmarketday-domain-migration.md`를 만들고 제목을 `kmarketday.com 도메인 전환 검증`으로 작성한다. 문서에는 `git rev-parse HEAD`의 실제 commit, `Asia/Seoul` 기준 실제 검증 시각, 공식 URL `https://kmarketday.com`, 기존 주소의 301 정책을 기록한다. 다음 각 항목은 실제 결과와 실행 증거를 함께 기록하고, 확인하지 못한 항목은 PASS로 표시하지 않는다: DNS/TLS/NPMplus, 새 도메인 주요 경로, canonical/OG/JSON-LD, robots/sitemap/ads.txt, 제보 Origin 허용·거부, Umami 대상 도메인, Argo CD rollout, Search Console, AdSense.

- [ ] **Step 7: 최종 운영 회귀를 완료한다**

Run: `pnpm test && pnpm typecheck && pnpm build && pnpm --filter @jangnal-map/web exec playwright test`

Expected: 코드 검증이 재현 가능하게 PASS하고, Task 6·7의 외부 검증 문서와 실제 배포 SHA가 일치한다.

- [ ] **Step 8: 검증 문서를 커밋한다**

```bash
git add docs/verification/2026-09-22-kmarketday-domain-migration.md
git commit -m "docs: record kmarketday.com domain migration"
```

---

## 사용자가 직접 수행해야 하는 항목

현재 앱 저장소에서 제가 처리할 수 있는 범위는 Next.js canonical/redirect 코드, 테스트, 운영 문서, 로컬 검증입니다. 다음 항목은 DNS·클러스터·외부 계정 권한과 실제 서비스 상태를 변경하므로 사용자가 직접 수행하거나 해당 운영 담당자에게 요청해야 합니다.

### 필수 인프라 작업

1. **도메인·DNS 권한 확인**
   - `kmarketday.com` 등록기관/DNS 관리 화면에 접근한다.
   - 현재 `spamfam.kr`이 사용하는 동일 public endpoint를 확인해 `kmarketday.com`의 A/AAAA 또는 CNAME을 추가한다.
   - `www.kmarketday.com`은 현재 canonical 계약에 포함하지 않는다. 이미 존재하는 경우에만 apex로 redirect하고, 새 레코드는 별도 요구가 없으면 만들지 않는다.
   - DNS 전파 전까지 기존 `spamfam.kr` 레코드와 TTL을 삭제·변경하지 않는다.

2. **NPMplus TLS·Host rule 설정**
   - `kmarketday.com` 인증서를 발급하고 인증서 SAN/갱신 상태를 확인한다.
   - `kmarketday.com`을 기존 Traefik upstream/포트로 전달한다.
   - `spamfam.kr`과 실제 연결된 레거시 host는 application route보다 먼저 `https://kmarketday.com`으로 path/query 보존 301을 하도록 설정한다.
   - 새 도메인 200을 확인하기 전에는 기존 host redirect를 켜지 않는다.

3. **GitOps Ingress/IngressRoute 수정**
   - 별도 `denadedev/gitops` 저장소에서 실제 `Ingress` 또는 `IngressRoute` manifest를 찾는다.
   - 기존 web Service·포트에 `kmarketday.com` Host와 필요한 TLS host를 추가한다.
   - 전환 기간 동안 `spamfam.kr` Host는 유지한다. 새 host를 별도 Service·Deployment로 보내지 않는다.
   - manifest를 GitOps 저장소의 협업 절차에 맞춰 commit/PR/merge하고 Argo CD `jangnal-map`의 Sync/Health를 확인한다.

4. **K3s Secret과 rollout**
   - 전환 중 `jangnal-web-env`의 `REPORT_ALLOWED_ORIGINS`를 `https://spamfam.kr,https://kmarketday.com`으로 설정하고, 안정화 후 `https://kmarketday.com` 하나로 축소한다.
   - `SMTP_USER`, `SMTP_PASS`, `REPORT_TO_EMAIL`은 변경하지 않는다.
   - Argo CD Sync 뒤 새 Pod rollout과 Ingress route status를 확인한다.

### 외부 서비스 작업

5. **네이버 지도 Client ID 허용 도메인**
   - 네이버 클라우드 플랫폼의 Maps 애플리케이션에서 웹 서비스 URL/허용 도메인 목록을 확인한다.
   - `https://kmarketday.com`을 추가하고 기존 `https://spamfam.kr`은 유지한다.
   - `www.kmarketday.com`을 실제 서비스 주소로 사용하지 않으면 추가하지 않는다.
   - 새 도메인에서 지도 SDK·지도 핀·현재 위치 기능을 확인한다. 오류가 발생하면 먼저 허용 도메인과 HTTPS origin을 점검한다.

6. **Umami**
   - 앱이 로드하는 script URL `https://analytics.spamfam.kr/script.js`는 유지한다.
   - Umami 관리 화면에 별도 허용 도메인 목록이 있다면 `kmarketday.com`을 추가하고, 기존 `spamfam.kr`은 바로 삭제하지 않는다.
   - 실제 페이지에서 `data-domains="kmarketday.com"`과 수집 여부를 확인한다.

7. **검색·광고 소유권**
   - Google Search Console에 `https://kmarketday.com` 속성을 추가·검증하고 `https://kmarketday.com/sitemap.xml`을 제출한다.
   - 기존 `spamfam.kr` 속성과 sitemap은 새 주소의 색인 상태가 안정화될 때까지 유지한다.
   - AdSense 사이트 목록에 새 주소를 추가하고 `https://kmarketday.com/ads.txt` 및 사이트 연결 상태를 확인한다.
   - Naver Search Advisor를 운영 중이면 새 도메인을 별도 등록·소유 확인하고, 기존 verification token으로 확인되지 않을 때 새 token을 앱 metadata에 반영한다.

8. **배포 승인과 모니터링**
   - 앱 저장소 변경의 PR/main 반영을 승인하고 GitHub Actions, Harbor image, GitOps commit, Argo CD rollout을 확인한다.
   - 새 도메인 200·제보·SEO 검증이 끝난 뒤에만 NPMplus의 기존 host 301을 활성화한다.
   - 전환 직후 주요 경로, TLS, redirect, 제보 API, Umami 수집, Search Console/AdSense 상태를 확인한다.

9. **운영 데이터·보존 정책**
   - 실제 운영 제보 메일을 보내는 검증은 별도 명시적 승인 후 한 건만 수행하고, 테스트 데이터 삭제 여부를 확인한다.
   - `spamfam.kr` DNS, TLS, NPMplus redirect, Search Console 속성은 새 주소가 안정화될 때까지 삭제하지 않는다.

---

## 최종 실행 순서

1. Task 1에서 `kmarketday.com` DNS/TLS/NPMplus 전달을 준비한다.
2. Task 1A에서 GitOps Ingress/IngressRoute에 새 Host와 필요한 TLS host를 추가한다.
3. Task 2에서 canonical·SEO·fallback redirect를 테스트 우선으로 변경한다.
4. Task 3에서 제보 Origin과 메일 URL fixture를 변경한다.
5. Task 4에서 운영 문서와 Release Site URL을 갱신한다.
6. Task 5에서 전체 테스트·타입·build·Playwright·container smoke를 통과시킨다.
7. 사용자가 K3s Secret과 Argo CD rollout을 확인한 뒤 Task 6에서 main 배포, 새 도메인 200, 기존 호스트 301을 순서대로 적용한다.
8. Task 7에서 운영 기능·SEO·분석·외부 콘솔을 검증하고 증적 문서를 커밋한다.

## 롤백 기준

- 새 도메인 200·TLS·route가 깨지면 NPMplus/DNS 설정을 먼저 수정하고 기존 `spamfam.kr` route는 유지한다.
- 새 image 또는 Secret 반영 후 앱 기능이 깨지면 GitOps image SHA를 검증된 이전 SHA로 되돌리고 Argo CD health를 확인한다.
- `spamfam.kr` 301을 켠 뒤 새 도메인이 정상 동작하지 않으면 NPMplus redirect rule을 일시 중지하고 기존 서비스 route를 복구한다. DNS 레코드와 기존 TLS는 삭제하지 않는다.
- Search Console·AdSense의 색인/검증 지연은 애플리케이션 rollback 조건이 아니다. 실제 HTTP·canonical·제보 기능이 실패할 때만 배포 rollback을 검토한다.

## What already exists

- `apps/web/src/lib/market-seo.ts`의 `SITE_URL`은 sitemap, robots, market detail metadata, WebSite JSON-LD가 재사용하는 기존 canonical 소스다. 이번 계획은 이를 `site-config.ts`로 옮기고 기존 consumers를 유지한다.
- `apps/web/next.config.ts`에는 Vercel·subdomain 레거시 host fallback이 이미 있다. 새 계획은 같은 Next.js redirect mechanism의 목적지만 바꾼다.
- `apps/web/src/lib/report-handler.ts`는 이미 deployment configuration을 읽고 client-supplied forwarding header를 무시한다. dual-origin parser는 이 guard 앞단만 확장한다.
- `apps/web/src/lib/naver-maps.ts`는 Client ID를 받아 SDK를 로드하고 실패 시 promise를 reject한다. `naver-maps.test.ts`와 UI fallback을 재사용하며 SDK loader를 새로 만들지 않는다.
- `.github/workflows/ci.yml`은 테스트·typecheck·AMD64 image·smoke test·Harbor·GitOps image update를 이미 수행한다. domain migration은 새 artifact나 별도 publish pipeline을 만들지 않는다.
- 별도 GitOps 저장소가 실제 Ingress/IngressRoute와 Argo CD 배포 상태를 소유한다. 앱 저장소에 없는 manifest를 복제하지 않는다.

## NOT in scope

- Umami 서버를 `analytics.kmarketday.com`으로 이전하지 않는다. 이번 변경은 수집 대상 domain만 바꾼다.
- Harbor registry, GitHub repository, K3s namespace, Argo CD Application 이름은 바꾸지 않는다. domain migration과 무관하고 rollback 범위를 넓힌다.
- `www.kmarketday.com` DNS record를 새로 만들지 않는다. 실제 운영 주소로 채택할 때 별도 결정한다.
- Search Console·AdSense의 기존 `spamfam.kr` property를 즉시 삭제하지 않는다. 새 주소 색인 안정화 후 별도 운영 작업이다.
- production smoke script를 새로 만들지 않는다. 사용자가 선택한 B안에 따라 기존 curl·브라우저 체크를 전환 당일 수행한다.
- 시장 데이터, URL path 체계, UI 문구, SMTP 구조, 지도 SDK loader 자체는 변경하지 않는다.

## Failure modes

| Failure mode | Test coverage | Error handling / user outcome |
| --- | --- | --- |
| `REPORT_ALLOWED_ORIGINS`가 빈 목록·잘못된 URL·지원하지 않는 protocol | `report-handler.test.ts` 설정 오류 cases | 500과 설정 오류 로그, mail transport 호출 없음 |
| 공격자 Origin 또는 forwarding header 위조 | handler/route tests | 403, 메일 미발송 |
| DNS/TLS가 새 endpoint를 가리키지 않음 | Task 1 curl·TLS preflight | 새 도메인 검증이 중단되고 기존 도메인은 유지 |
| Ingress Host가 잘못된 Service/포트를 가리킴 | GitOps diff·Argo CD status·새 도메인 200 확인 | 새 도메인 route 실패, old redirect는 활성화하지 않음 |
| old host redirect가 누락되거나 200으로 중복 제공 | 전환 당일 manual curl | 301·Location·query 보존을 확인한 뒤에만 완료 처리 |
| canonical metadata가 일부 old host를 계속 생성 | Vitest·Playwright·HTML 검사 | 배포 완료로 표시하지 않고 app image를 수정 |
| Naver Maps allowlist 누락 | existing loader/fallback tests + production browser check | 지도 실패 시 기존 목록 fallback을 보여 서비스 탐색은 유지 |

이 범위에서 테스트와 운영 확인이 없는 silent failure는 남기지 않는다. 실제 DNS·NPMplus·Ingress는 로컬 CI에서 재현할 수 없으므로 수동 운영 증적을 필수 완료 조건으로 둔다.

## Worktree parallelization strategy

| Step | Modules touched | Depends on |
| --- | --- | --- |
| App canonical + report changes | `apps/web/src/lib/`, `apps/web/src/app/`, `apps/web/e2e/` | — |
| GitOps ingress + DNS/TLS/NPMplus preflight | external DNS, NPMplus, `denadedev/gitops/apps/jangnal-map/` | — |
| Docs + release metadata | root docs, `apps/web/README.md`, `scripts/` | — |
| Production cutover + consoles | K3s Secret, Argo CD, NPMplus, Naver Maps, Umami, Search Console, AdSense | App tests/build + ingress preflight |

Lane A: App canonical + report changes → local verification.

Lane B: GitOps ingress + DNS/TLS/NPMplus preflight (independent of source edits).

Lane C: Docs + release metadata (independent of source edits, but merge with Lane A before release).

Lane D: Production cutover + external consoles, after Lanes A/B/C complete.

Launch Lanes A, B, and C in parallel where the operator has the required external access. Wait for all three before Lane D. Lane A and Lane C both touch release-facing documentation/tests only where explicitly listed; keep their commits separate to avoid accidental merge conflicts.

## Implementation Tasks

Synthesized from this review's findings. Each task derives from a specific finding above. Run with Codex; checkbox as you ship.

- [ ] **T1 (P1, human: ~2h / CC: ~20min)** — Report Origin cutover — Add exact dual-origin allowlist, invalid-config 500, and final old-Origin removal.
  - Surfaced by: Architecture Review D2 and Code Quality Review D3; `report-handler.ts` currently compares one configured Origin.
  - Files: `apps/web/src/lib/report-handler.ts`, `apps/web/src/lib/report-handler.test.ts`, `apps/web/src/app/api/report/route.test.ts`, K3s `jangnal-web-env` Secret.
  - Verify: targeted Vitest suite; old/new Origin during cutover; old Origin 403 after final Secret rollout.
- [ ] **T2 (P2, human: ~1h / CC: ~10min)** — Shared site config — Centralize `SITE_URL` and `SITE_HOST` without importing market catalog into layout.
  - Surfaced by: Code Quality Review D4; canonical values are duplicated across SEO and layout.
  - Files: `apps/web/src/lib/site-config.ts`, `apps/web/src/lib/site-config.test.ts`, `apps/web/src/lib/market-seo.ts`, `apps/web/src/app/layout.tsx`, related tests.
  - Verify: site-config, SEO, layout, page, and market detail tests.
- [ ] **T3 (P1, human: ~1h / CC: ~10min)** — Edge cutover — Apply the verified GitOps Ingress/DNS/NPMplus sequence and preserve the manual 301 evidence.
  - Surfaced by: Architecture Review data-flow check and Test Review D5; actual public routing cannot be covered by local Playwright.
  - Files: external `denadedev/gitops` Ingress/IngressRoute, DNS/NPMplus, Task 6 verification record.
  - Verify: new-domain 200, exact old-host 301, Location path/query preservation, TLS and Argo CD health.

_No new implementation task from Performance Review._

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 4 issues resolved; 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG CLEARED — ready to implement after applying T1–T3.

NO UNRESOLVED DECISIONS
