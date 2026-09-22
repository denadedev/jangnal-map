# kmarketday.com 도메인 전환 설계

## 목표

오늘 장날의 공식 공개 주소를 `https://spamfam.kr`에서 `https://kmarketday.com`으로 전환한다. 기존 `spamfam.kr`과 현재 확인된 레거시 호스트는 사용자를 잃지 않도록 새 canonical 주소로 영구 이동시키고, 애플리케이션·제보 API·SEO·분석·K3s 운영 설정을 하나의 전환 단위로 검증한다.

## 배경과 현재 상태

- 현재 애플리케이션의 canonical 기준은 `https://spamfam.kr`이다.
- 서비스는 `spamfam.kr` → NPMplus TLS → Traefik → Next.js 컨테이너 경로로 운영된다.
- `apps/web/src/lib/market-seo.ts`의 `SITE_URL`, `apps/web/src/app/layout.tsx`의 `metadataBase`와 Umami 대상 도메인, sitemap·robots·JSON-LD가 현재 도메인에 의존한다.
- `apps/web/next.config.ts`에는 `jangnal-map.vercel.app`과 `jangnal.spamfam.kr`을 `spamfam.kr`으로 보내는 레거시 호스트 규칙이 있다.
- 제보 API는 공개 Origin allowlist로 검증하며, 현재 K3s 런타임에는 `REPORT_ALLOWED_ORIGIN=https://spamfam.kr`이 주입되어 있다.
- 운영 문서·릴리스 메시지·테스트 픽스처에도 여러 공개 주소가 남아 있다.
- 저장소에는 DNS, NPMplus, Traefik, Argo CD, Search Console, AdSense의 실제 계정 설정이 없으므로 해당 변경은 운영 체크리스트로 수행하고 인증정보는 저장소에 기록하지 않는다.

## 확정 결정

### 공개 주소와 호스트 역할

| 역할 | 전환 후 값 | 동작 |
| --- | --- | --- |
| 공식 서비스 | `https://kmarketday.com` | 유일한 200 응답 및 canonical 기준 |
| 기존 apex | `https://spamfam.kr` | 새 도메인으로 영구 리디렉션 |
| 기존 레거시 호스트 | `https://jangnal.spamfam.kr`, `https://jangnal-map.vercel.app` | 경로·쿼리를 보존해 새 도메인으로 영구 리디렉션 |
| 분석 스크립트 서버 | `https://analytics.spamfam.kr/script.js` | 이번 전환에서는 유지 |
| 분석 허용 대상 | `kmarketday.com` | Umami `data-domains` 값만 변경 |
| 제보 허용 Origin | 전환 중 `https://spamfam.kr`, `https://kmarketday.com`; 안정화 후 새 주소만 | 단계별 Secret rollout으로 허용 |

`www.kmarketday.com`은 현재 저장소에서 확인된 서비스 주소가 아니므로 canonical 계약에 포함하지 않는다. 운영 DNS에 이미 존재하는 경우에만 NPMplus에서 `https://kmarketday.com`으로 별도 영구 리디렉션하고, 존재하지 않으면 새 레코드를 임의로 만들지 않는다.

### 리디렉션 상태 코드의 책임

Next.js `redirects()`의 `permanent: true`는 301이 아닌 308을 생성한다. 사용자가 승인한 기존 주소 유지 정책을 HTTP 301로 보장하기 위해 NPMplus를 `spamfam.kr` 및 실제로 연결된 레거시 호스트의 외부 301 책임자로 둔다. 애플리케이션의 `next.config.ts` 호스트 규칙은 프록시 우회·개발·Vercel 잔존 경로를 위한 방어적 fallback으로 새 도메인을 가리킨다. 운영 검증은 NPMplus 응답을 기준으로 301을 확인하고, 애플리케이션 fallback은 영구 리디렉션과 목적지·경로·쿼리 보존을 확인한다.

### 분석과 외부 서비스

분석 수집 서버 `analytics.spamfam.kr`까지 함께 이전하지 않는다. 새 사이트에서 해당 스크립트를 계속 로드하되 `data-domains="kmarketday.com"`으로 제한한다. Search Console과 AdSense는 새 사이트 주소를 별도 속성으로 등록·검증하고, 기존 속성과 sitemap은 즉시 삭제하지 않고 새 주소의 색인 상태가 확인될 때까지 유지한다.

### 네이버 지도 Client ID와 허용 도메인

현재 코드의 네이버 지도 SDK endpoint와 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`는 사이트 도메인과 분리되어 있으므로 값을 변경하지 않는다. 네이버 클라우드 플랫폼의 Maps 애플리케이션에 등록된 웹 서비스 URL/허용 도메인 목록에 `https://kmarketday.com`을 추가하고, 전환 기간 동안 `https://spamfam.kr`을 유지한다. `www.kmarketday.com`을 실제 서비스 주소로 사용하지 않으면 등록하지 않는다.

새 도메인의 실제 브라우저에서 지도 SDK가 정상 로드되고 지도·마커·현재 위치·지도 실패 fallback이 동작하는지 확인한다. 도메인 제한 오류가 발생하면 Client ID를 새로 발급하거나 코드를 바꾸지 말고, 먼저 네이버 Maps 애플리케이션의 허용 도메인과 HTTPS origin 등록을 확인한다.

### 제보 Origin의 단계적 전환

현재 제보 handler는 단일 `REPORT_ALLOWED_ORIGIN` 문자열을 비교한다. 전환 중 기존 도메인에서 열린 제보 화면이 403이 되지 않도록 handler는 새 `REPORT_ALLOWED_ORIGINS`의 쉼표 구분 allowlist를 우선 읽고, 로컬·preview 호환을 위해 기존 단일 변수도 fallback으로 지원한다. Production 첫 배포에서는 정확히 `https://spamfam.kr,https://kmarketday.com` 두 값만 허용하고, NPMplus 301과 새 도메인 제보 검증이 안정화된 뒤 `https://kmarketday.com` 하나로 Secret을 다시 배포한다.

allowlist가 비어 있거나 URL origin으로 파싱되지 않으면 요청을 허용하지 않고 500과 설정 오류 로그를 반환한다. 정상적인 비허용 Origin은 403으로 처리하며, 설정 원문·SMTP 자격증명은 로그에 남기지 않는다.

## 제안 아키텍처

### 1. 인프라 선행 준비

운영자는 현재 `spamfam.kr`이 가리키는 동일한 공개 엔드포인트를 확인한 뒤 `kmarketday.com`의 DNS 레코드를 추가한다. NPMplus에 새 Host rule과 TLS 인증서를 준비하고, 동일한 Traefik/Next.js 서비스로 전달한다. 기존 `spamfam.kr` 라우팅은 유지하며, 새 도메인에서 애플리케이션을 먼저 검증할 수 있게 한다.

NPMplus에는 다음 우선순위를 적용한다.

1. `kmarketday.com`: 기존 애플리케이션으로 전달
2. `spamfam.kr`: 동일 경로·쿼리를 `https://kmarketday.com`으로 301
3. 연결되어 있는 `jangnal.spamfam.kr` 및 기타 확인된 레거시 호스트: 동일하게 301

리디렉션 호스트가 애플리케이션까지 전달되어 200을 반환하는 상태가 되면 중복 콘텐츠가 생기므로, NPMplus의 redirect rule이 애플리케이션 route보다 먼저 평가되어야 한다.

### 1-1. GitOps Ingress 변경

현재 앱 저장소에는 Ingress manifest가 없다. GitHub Actions가 참조하는 별도 `denadedev/gitops` 저장소에서 `apps/jangnal-map/` 아래의 실제 `Ingress` 또는 Traefik `IngressRoute` 리소스를 검색해 수정한다. 리소스 종류와 파일 경로는 저장소에서 확인한 값을 사용하며 추측하지 않는다.

Ingress의 동일한 web Service/포트 대상에 `kmarketday.com` Host를 추가하고, 기존 `spamfam.kr` Host는 전환 기간 동안 유지한다. NPMplus가 기존 Host의 301을 먼저 처리하므로 정상 운영 시 old host는 Ingress까지 도달하지 않지만, 우회·롤백 경로를 보존하기 위해 Ingress의 old host를 즉시 삭제하지 않는다. Traefik `IngressRoute`라면 `Host(\`kmarketday.com\`)`을 기존 Host match와 같은 route에 추가하고, Kubernetes `Ingress`라면 `spec.rules[].host`와 TLS hosts를 같은 Service에 추가한다.

TLS가 NPMplus에서만 종료되면 Ingress의 TLS secret은 새로 만들지 않고 Host routing만 변경한다. Traefik도 TLS를 종료하는 구조라면 인증서 resolver 또는 TLS secret에 `kmarketday.com`을 추가하고, NPMplus와 Traefik 양쪽에서 인증서의 SAN과 갱신 상태를 확인한다. Ingress 변경 후 새 도메인은 같은 Next.js Pod로 200을 반환해야 하며, Service·Deployment 이름·포트·Harbor image 경로는 변경하지 않는다.

### 2. 애플리케이션 기준 URL 교체

애플리케이션은 새 canonical 값을 가벼운 공통 설정 모듈에서 읽어 SEO와 루트 metadata가 같은 값을 사용하게 한다.

- `SITE_URL = "https://kmarketday.com"`
- `SITE_HOST = new URL(SITE_URL).hostname`
- `metadataBase = new URL(SITE_URL)`
- JSON-LD WebSite URL, Open Graph absolute URL, market detail canonical, sitemap, robots의 host·sitemap URL은 `SITE_URL`을 통해 생성
- Umami script URL은 `https://analytics.spamfam.kr/script.js`로 유지하고 `data-domains`만 `kmarketday.com`으로 변경
- 전환 중 `REPORT_ALLOWED_ORIGINS=https://spamfam.kr,https://kmarketday.com`을 K3s Secret에 주입하고, 안정화 후 `https://kmarketday.com` 하나로 축소

모든 내부 상대 링크는 그대로 둔다. 사용자가 직접 공유하는 absolute URL과 메일 본문에 포함되는 제출 페이지 URL은 새 `SITE_URL` 또는 새 테스트 픽스처를 사용한다.

### 3. 레거시 호스트 fallback

`apps/web/next.config.ts`의 기존 레거시 규칙은 삭제하지 않고 목적지만 `https://kmarketday.com/:path*`으로 변경한다. `spamfam.kr` 규칙을 추가해 프록시 설정이 누락되거나 우회된 경우에도 앱이 새 주소를 안내한다. Next.js의 redirect 구현이 308을 반환하는 것은 의도된 fallback 특성으로 문서화하고, 운영의 정확한 301은 NPMplus 검증으로 보장한다.

## 파일별 변경 책임

### 애플리케이션 및 테스트

- `apps/web/src/lib/site-config.ts`: `SITE_URL`과 `SITE_HOST`의 단일 소스
- `apps/web/src/lib/site-config.test.ts`: URL과 hostname 계약
- `apps/web/src/lib/market-seo.ts`: 공통 `SITE_URL` re-export 및 SEO URL 생성
- `apps/web/src/app/layout.tsx`: 공통 설정을 사용한 `metadataBase`, 분석 허용 도메인
- `apps/web/next.config.ts`: `spamfam.kr`과 확인된 레거시 호스트의 fallback 목적지 변경
- `apps/web/src/lib/report-handler.test.ts`: 허용 Origin 기대값을 새 도메인으로 변경하고 forwarding header 위조 거부를 유지
- `apps/web/src/app/layout.test.tsx`: Umami script URL은 유지되고 `data-domains`는 새 도메인인지 검증
- `apps/web/src/app/page.test.tsx`, `apps/web/src/app/seo-routes.test.ts`, `apps/web/src/app/markets/[slug]/page.test.tsx`: JSON-LD, canonical, Open Graph, sitemap, robots, fallback 목적지 검증
- `apps/web/src/app/api/report/route.test.ts`, `apps/web/src/lib/report-email.test.ts`: 제보 Origin·메일 본문의 페이지 URL 픽스처 변경
- `apps/web/e2e/adsense-readiness.spec.ts`, `apps/web/scripts/smoke-container.mjs`: 새 canonical 연결 파일과 API 동작 기준 갱신. 컨테이너 smoke test는 로컬 Origin을 계속 사용하고 운영 도메인 검증은 별도 curl 절차로 수행

### 운영 문서와 릴리스 산출물

- `README.md`: 분석 대상, 공식 서비스 경로, 도메인 전환 후 운영 주소 갱신
- `apps/web/README.md`: `REPORT_ALLOWED_ORIGIN`, K3s 도메인 경로, DNS/TLS와 rollout 검증 문구 갱신
- 별도 `denadedev/gitops` 저장소의 실제 Ingress/IngressRoute manifest: `kmarketday.com` Host와 TLS 대상 추가, old host 유지
- 네이버 클라우드 플랫폼 Maps 애플리케이션: `https://kmarketday.com` 웹 서비스 URL 추가, 기존 `https://spamfam.kr` 유지
- `scripts/create-release.mjs`: Release 본문의 Site 링크를 `https://kmarketday.com/`으로 변경. Harbor registry 주소는 서비스 도메인이 아니므로 유지
- `scripts/create-release.test.mjs`: 새 Site 링크 기대값 추가. 이미지 registry 기대값은 유지
- `docs/verification/2026-09-22-kmarketday-domain-migration.md`: 실제 전환 commit, 확인 시각, HTTP 응답, TLS·rollout·SEO·제보 검증 결과를 기록

기존 `CHANGELOG.md`와 이전 AdSense 검증 문서는 과거 상태를 기록하므로 이 전환 때문에 과거 사실을 다시 쓰지 않는다. 새 릴리스 변경 내역이 필요할 때만 별도 항목을 추가한다.

## 데이터 흐름

```text
사용자
  ├─ https://kmarketday.com/*
  │    └─ DNS → NPMplus TLS/Host → Traefik → Next.js 200
  │         ├─ canonical/OG/sitemap/robots → kmarketday.com
  │         ├─ /api/report Origin 검사 → https://kmarketday.com
  │         └─ Umami script → analytics.spamfam.kr
  └─ https://spamfam.kr/* 또는 레거시 호스트
       └─ NPMplus 301(경로·쿼리 보존) → https://kmarketday.com/*
```

제보 요청은 새 도메인에서 렌더링된 화면이 `Origin: https://kmarketday.com`으로 전송하고, 전환 중에는 기존 도메인의 `Origin: https://spamfam.kr`도 제한적으로 허용한다. 서버는 Secret의 allowlist와 정확히 일치할 때만 처리하며, 클라이언트가 제공한 forwarding header는 허용 Origin 결정에 사용하지 않는 기존 보안 동작을 유지한다. old host 301과 새 도메인 제보 검증이 안정화되면 old Origin을 allowlist에서 제거한다.

## 실패 처리와 롤백

- DNS가 새 주소를 잘못 가리키면 `kmarketday.com`의 DNS/TLS/Host 설정을 먼저 수정하고 기존 `spamfam.kr` 서비스는 그대로 둔다.
- 새 이미지가 배포된 뒤 애플리케이션 검증이 실패하면 GitOps의 이미지 SHA를 검증된 이전 SHA로 변경하고 Argo CD rollout을 확인한다.
- `REPORT_ALLOWED_ORIGIN` 누락 또는 잘못된 값으로 제보가 거부되면 Secret을 수정하고 재배포한다. SMTP 자격증명은 로그·문서·커밋에 기록하지 않는다.
- Search Console·AdSense 검증이 지연되어도 새 도메인의 HTTP 서비스와 canonical 전환을 되돌리지 않는다. 색인 전환은 콘솔 상태를 확인하며 단계적으로 진행한다.
- 기존 `spamfam.kr`의 DNS 레코드와 NPMplus redirect rule은 새 사이트가 안정화될 때까지 삭제하지 않는다.

## 완료 기준

다음 조건을 모두 만족해야 전환을 완료로 표시한다.

1. `https://kmarketday.com`의 홈, 주요 보조 페이지, 대표 시장 상세, 제보, 개인정보, 404가 HTTPS로 정상 응답한다.
2. 새 도메인의 모든 canonical, Open Graph absolute URL, JSON-LD WebSite URL, sitemap URL, robots host가 `kmarketday.com`이다.
3. `spamfam.kr` 및 실제 연결된 레거시 호스트의 대표 경로·쿼리가 301로 새 도메인에 도달하고, 레거시 호스트가 콘텐츠를 200으로 중복 제공하지 않는다.
4. 전환 중 새·기존 Origin은 허용되고 공격자 Origin과 forwarding header 위조는 거부되며, 안정화 후 기존 Origin 제거가 확인된다.
5. Umami 스크립트는 로드되며 수집 대상은 `kmarketday.com`이고, 분석 서버 주소는 의도대로 유지된다.
6. 새 도메인에서 네이버 지도 SDK, 지도·마커·현재 위치가 로드되고 지도 실패 fallback도 유지된다.
7. `ads.txt`, `robots.txt`, `sitemap.xml`의 HTTP 응답과 본문이 새 canonical 기준에 맞는다.
8. `pnpm test`, `pnpm typecheck`, `pnpm build`, Playwright, 컨테이너 smoke test가 통과한다.
9. NPMplus TLS, Traefik 전달, Argo CD rollout, Search Console sitemap, AdSense 사이트, 네이버 Maps 허용 도메인 상태를 실제 운영 환경에서 확인하고 검증 문서에 결과를 기록한다.

## 범위 밖

- Umami 서버를 `analytics.kmarketday.com`으로 이전하는 작업
- Harbor registry, GitHub repository, K3s namespace, Argo CD Application 이름 변경
- 시장 데이터, URL 경로 체계, UI 문구, 인증·SMTP 구조 변경
- 이전 도메인의 즉시 폐기 또는 DNS 레코드 삭제
