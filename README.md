# 오늘 장날

전국 전통시장 1,393곳을 정적 데이터로 탐색하는 Next.js MVP입니다. 매일 운영하는 상설시장, 정기 장날 시장과 일정 확인이 필요한 시장을 함께 제공하며, 전국 지도에서는 군집으로 표시합니다. NAVER Maps 키가 없거나 지도 SDK를 불러오지 못해도 시장 목록, 검색, 날짜 필터와 상세 정보는 사용할 수 있습니다.

## 설치

```bash
pnpm install
```

## 시장 데이터 생성

원본 CSV를 준비한 뒤 다음 명령으로 공개용 정적 데이터를 만듭니다. `--encoding`에는 원본 파일에 맞춰 `utf8` 또는 `euc-kr`을 지정합니다.

생성 결과에는 원본 행 전체가 포함됩니다. 좌표가 없는 시장은 목록과 상세에는 나타나지만 지도에는 표시되지 않으며, 일정은 `daily`, `digit-pair`, `unknown`으로 구분됩니다.

```bash
pnpm --filter jangnal-market-data-audit generate -- \
  --input data/raw/markets.csv \
  --encoding euc-kr \
  --output ../../apps/web/public/data/markets.json
```

## 로컬 실행

개발 서버는 다음과 같이 실행합니다.

```bash
pnpm --filter @jangnal-map/web dev
```

프로덕션 빌드와 로컬 프로덕션 서버는 다음과 같습니다.

```bash
pnpm build
pnpm --filter @jangnal-map/web start
```

포트를 직접 지정할 때는 앱 디렉터리에서 실행합니다.

```bash
cd apps/web
pnpm exec next start -p 3030
```

## NAVER Maps 키

지도 표시는 선택 사항입니다. `apps/web/.env.example`을 참고해 `apps/web/.env.local`에 클라이언트 ID를 설정합니다.

```bash
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=your_naver_maps_client_id
```

키를 비워 두면 지도 영역은 목록 탐색 안내로 대체되며, 검색·날짜 필터·시장 상세 정보는 계속 동작합니다.

## 모바일 탐색

모바일 홈은 검색·날짜 필터 아래의 탐색 제목, 지도 카드와 시장 목록을 한 스크롤 화면으로 보여줍니다. 지도 위를 세로로 쓸어도 목록으로 내려갈 수 있으며, 지도 핀과 현재 위치 버튼은 사용할 수 있습니다. 지도·목록 전환과 하단 탐색으로 원하는 화면을 선택하고, 검색은 별도 화면에서 진행합니다. 지도 핀이나 목록에서 시장을 고르면 전체 화면 상세가 열리며 방문 날짜를 달력에서 바꿀 수 있습니다. 상세에서 돌아오면 이전 검색 조건, 목록 스크롤, 지도 위치와 포커스를 복원합니다. 지도 연결에 실패해도 목록을 이용할 수 있습니다. 시장별 방문 정보는 목록 아래에, 서비스·법률 링크는 메뉴에 있습니다.

검색 화면은 이름·지역의 검색 일치 수와 날짜 조건에 맞는 시장 수를 따로 보여줍니다. 비장날 시장도 다음 장날과 함께 남겨 두며, 상세에서 방문일 이후의 다음 장날로 바꾸거나 날짜 조건을 해제할 수 있습니다. 상세에서 검색으로 돌아오면 바꾼 날짜와 검색어가 유지됩니다.

이전 지도 우선 화면의 검증 기록은 [모바일 지도 확인 체크리스트](docs/verification/mobile-map-first-2026-09-24.md)와 [모바일 UX 검증 보고서](docs/verification/mobile-ux-2026-09-21.md)에 남겨 두었습니다.

## 방문 통계

방문자와 페이지뷰는 `https://analytics.spamfam.kr`의 셀프호스트 Umami로 집계합니다.
추적 대상 서비스 주소는 `https://kmarketday.com`이며 로컬 개발 접속은 집계하지 않습니다.
검색어와 필터가 포함된 URL 쿼리 문자열은 수집하지 않습니다. 분석용 쿠키는 사용하지 않으며
수집 내용은 `/privacy`에서 안내합니다.

## 영어 방문 안내

`/en`은 한국 전통시장과 장날의 차이, 장날에 방문할 이유, 지도 사용법을 영어로 설명합니다. `/en/map`에서는 영어 메뉴와 날짜 필터로 전국 시장을 탐색하고 17개 시·도 이름(예: `Seoul`, `Busan`, `Jeju`)으로 검색할 수 있습니다. 시장명과 주소는 한글 원문을 유지하며 개별 영문 시장명 검색은 제공하지 않습니다.

장날과 `Today`는 한국 날짜(Asia/Seoul) 기준입니다. 상세 화면의 `Maps & directions`에서 NAVER 경로 또는 Google 지도 위치 보기를 선택합니다. Google 지도의 한국 내 경로 제공 여부는 보장하지 않습니다. 영어 안내 페이지만 sitemap에 등록하며 영어 지도는 검색 색인에서 제외합니다.

기능 범위와 남은 실기기·사용자 검증 항목은 [영어 방문자 기획](docs/product/2026-09-28-english-traveler-plan.md)에 정리했습니다. 배포 후에는 Search Console에서 `/en` 색인·검색 노출을, Umami에서 `/en`과 `/en/map` 방문을 확인합니다. 유입 경로가 `Direct`인 방문은 영어 검색 유입으로 계산하지 않습니다.

## AdSense 승인 준비

승인 전에는 광고 요청을 만들지 않습니다. 사이트 연결은 루트 `ads.txt`와
`google-adsense-account` 메타 태그로 확인하며, 전역 `adsbygoogle.js`를 복원하지 않습니다.
검수된 시장만 독립 상세 URL과 sitemap에 포함하고, 미검수 시장은 홈 지도 선택 상태에서만 제공합니다.
배포 전후 검증 순서는 [AdSense 승인 준비 검증](docs/verification/adsense-readiness-2026-09-21.md)을 따릅니다.

## 사용자 제보 접수

시장 정보 수정과 서비스 불편 신고는 오늘장날의 `/report` 화면에서 받고 `/api/report`가 Nodemailer와 Gmail SMTP를 통해 운영자 이메일로 전달합니다. 제보 데이터베이스는 사용하지 않습니다.

전용 Google 계정에서 2단계 인증을 켜고 앱 비밀번호를 발급합니다. 일반 로그인 비밀번호는 사용하지 않습니다. 로컬에서는 `apps/web/.env.local`, K3s에서는 `jangnal-map` namespace의 `jangnal-web-env` Secret에 `SMTP_USER`, `SMTP_PASS`를 저장합니다. 수신 주소가 발신 Gmail과 다르면 `REPORT_TO_EMAIL`도 설정합니다.

`SMTP_PASS`는 브라우저에 노출되지 않으며 저장소나 채팅에 기록하지 않습니다. SMTP 설정이 없으면 지도와 시장 탐색은 작동하지만 제보 제출은 비활성화됩니다. Production에서는 실제 제보 한 건을 보내 운영자 이메일 도착과 메일 라벨 적용을 확인한 뒤 테스트 제보를 삭제합니다.

제보 API의 IP 기준 요청 제한은 아직 미구현입니다. 목표는 IP당 10분에 5건, 초과 시 429이며, 프록시의 실제 클라이언트 IP 신뢰 설정과 함께 별도로 적용해야 합니다. CI/CD 성공이 이 보호 조치의 완료를 뜻하지 않습니다.

## K3s 배포와 Release

`main` 반영 → CI 테스트·이미지 검증 → Harbor 게시 → GitOps 이미지 갱신 → GitHub Release 생성 순서입니다. Argo CD가 GitOps 변경을 감지해 K3s에 배포합니다. Release는 **배포 요청 완료 기록**이며 실제 Pod 배포 완료를 보장하지 않습니다.

공식 서비스 주소는 `https://kmarketday.com`이며, 기존 `https://spamfam.kr`과 연결된 레거시 호스트는 NPMplus에서 경로·쿼리를 보존한 301로 새 주소로 보냅니다. 요청 경로는 NPMplus(TLS) → Traefik → Next.js 컨테이너로 전달됩니다. Vercel Git 연결은 해제했고 기존 프로젝트는 일시 중지 상태입니다. 환경변수·권한·재실행·롤백 안내는 [웹 배포 안내](apps/web/README.md)를 참고합니다.

배포 전에는 다음 검증을 실행합니다.

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @jangnal-map/web exec playwright test
```
