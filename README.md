# 오늘 장날

전국 전통시장 1,393곳의 장날을 지도와 목록으로 찾아보는 서비스입니다. 매일 여는 상설시장, 날짜 끝자리로 서는 5일장, 일정 확인이 필요한 시장을 함께 보여 줍니다. 서비스 주소는 https://kmarketday.com 입니다.

NAVER Maps 키가 없거나 지도 SDK를 불러오지 못해도 시장 목록, 검색, 날짜 필터와 상세 정보는 그대로 동작합니다.

## 한눈에 보기

| 영역 | 내용 |
|---|---|
| 화면 | Next.js 16(App Router), React 19, Tailwind CSS 4, TanStack Query |
| 지도 | NAVER Maps Web Dynamic Map (선택) |
| 데이터 | 운영은 PostgreSQL + Drizzle ORM, 로컬 기본값은 `public/data` JSON |
| 제보 | 장 정보 제보는 DB 저장 + 슬랙 승인, 정보 수정·불편 신고는 Gmail SMTP 메일 |
| 테스트 | Vitest + Testing Library, Playwright(e2e) |
| 배포 | GitHub Actions → Harbor → GitOps(`denadedev/gitops`) → Argo CD → K3s |
| 통계 | 셀프호스트 Umami (`https://analytics.spamfam.kr`) |

## 저장소 구조

```text
apps/web/            Next.js 앱 (화면, API, DB 스키마·마이그레이션)
  src/app/           페이지와 API 라우트
  src/components/    화면 컴포넌트
  src/lib/           장날 계산, 카탈로그 로딩, 제보·슬랙·SEO 로직
  src/db/            Drizzle 스키마, 코드값, 시드·검증 CLI
  drizzle/           SQL 마이그레이션
  public/data/       시장 데이터 JSON (DB 시드 원본, 로컬 기본 출처)
  e2e/               Playwright 테스트
work/data-audit/     원본 CSV → 공개용 JSON 생성·온누리 매칭 도구
scripts/             CI가 쓰는 GitOps 갱신·Release 생성 스크립트
docs/                기획(product), 검증 기록(verification), 설계 메모
```

운영 세부 사항(컨테이너, 런타임 환경변수, Actions 권한, DB 명령, 롤백)은 [웹 배포 안내](apps/web/README.md)에 있습니다.

## 시작하기

Node.js 22와 pnpm 10을 씁니다.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # 필요한 값만 채웁니다
pnpm --filter @jangnal-map/web dev
```

환경변수를 하나도 넣지 않아도 `public/data` JSON으로 홈, 지도 목록, 상세, 지역 페이지를 볼 수 있습니다. 지도, 메일 제보, 장 정보 제보는 아래 환경변수가 있을 때만 켜집니다.

프로덕션 빌드와 로컬 프로덕션 서버는 다음과 같습니다. 포트를 바꿀 때는 `apps/web`에서 `pnpm exec next start -p 3030`처럼 실행합니다.

```bash
pnpm build
pnpm --filter @jangnal-map/web start
```

## 환경변수

로컬은 `apps/web/.env.local`, K3s는 `jangnal-map` namespace의 `jangnal-web-env` Secret에 넣습니다. 비밀 값은 저장소나 채팅에 남기지 않습니다.

| 이름 | 쓰임 | 없을 때 |
|---|---|---|
| `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` | 지도 표시. 빌드 때 들어가는 공개 값 | 지도 자리에 목록 안내가 나옵니다 |
| `CATALOG_SOURCE` | 시장 데이터 출처. `json`(기본) 또는 `db`. 운영은 `db` | JSON을 읽습니다 |
| `DATABASE_URL` | PostgreSQL 접속 주소 | DB 모드와 장 정보 제보가 꺼집니다 |
| `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID` | 장 정보 제보 승인 요청을 슬랙으로 보냅니다 | 장 정보 제보 버튼이 숨습니다 |
| `SLACK_SIGNING_SECRET`, `SLACK_APPROVER_IDS` | 슬랙 승인·반려·삭제 버튼 서명 검증과 승인자 목록 | 승인 처리를 할 수 없습니다 |
| `SMTP_USER`, `SMTP_PASS` | `/report` 메일 전송 (Gmail 앱 비밀번호) | `/report` 제출이 꺼집니다 |
| `REPORT_TO_EMAIL` | `/report` 수신 주소 | `SMTP_USER`로 받습니다 |
| `REPORT_ALLOWED_ORIGINS` | 제보 API가 받아 줄 Origin 목록(쉼표 구분) | 요청 URL 기준으로 검사합니다 |
| `REVALIDATE_TOKEN` | `POST /api/revalidate` Bearer 토큰 | 그 엔드포인트가 404입니다 |

화면 확인만 할 때는 `DATABASE_URL`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`에 가짜 값을 넣어도 장 정보 제보 버튼이 보입니다. 실제 제출은 실패합니다.

## 시장 데이터

시장 데이터는 공공 원본 CSV에서 만든 `apps/web/public/data/markets.json`과 편집 정보 `market-editorial.json`에서 시작합니다. 운영에서는 이 JSON을 PostgreSQL에 시드한 뒤 DB를 읽습니다. 화면은 `loadCatalog()`(`apps/web/src/lib/catalog/`)로 스냅샷을 읽고, 스냅샷은 프로세스 메모리에 1시간 둡니다.

원본 CSV에서 JSON을 다시 만들 때는 다음 명령을 씁니다. `--encoding`은 원본에 맞춰 `utf8` 또는 `euc-kr`로 지정합니다. 좌표가 없는 시장은 목록과 상세에만 나오고 지도에는 표시되지 않으며, 일정은 `daily`, `digit-pair`, `unknown`으로 나뉩니다.

```bash
pnpm --filter jangnal-market-data-audit generate -- \
  --input data/raw/markets.csv \
  --encoding euc-kr \
  --output ../../apps/web/public/data/markets.json
```

로컬에서 DB 모드를 쓰려면 PostgreSQL 16을 띄우고 `apps/web`에서 실행합니다.

```bash
export DATABASE_URL=postgres://<user>:<password>@localhost:5432/<db>
pnpm db:migrate   # 마이그레이션 적용
pnpm db:seed      # 빈 DB에 JSON 시드
pnpm db:verify    # 행 수와 스키마 규칙 확인
pnpm db:parity    # DB 스냅샷이 JSON 스냅샷과 같은지 확인
CATALOG_SOURCE=db pnpm dev
```

스키마는 `src/db/schema.ts`, 코드값과 화면 이름은 `src/db/codes.ts`에 있습니다. 스키마를 바꾸면 `pnpm db:generate`로 마이그레이션을 만들고 새 테이블·컬럼의 comment를 SQL에 함께 넣습니다. 운영 DB 마이그레이션은 GitOps의 PreSync Job이 배포 때 실행합니다.

## 주요 화면

- **홈 `/`**: 검색, 날짜 필터(오늘 · 다가오는 주말 · 전체), 지도 카드와 시장 목록을 한 화면에서 봅니다. 모바일에서 지도 핀이나 목록을 누르면 시장 상세가 바로 열리고, 돌아오면 검색 조건·스크롤·지도 위치를 복원합니다. 첫 화면은 "오늘"이며 예전 `?when=week`, `?when=date` 링크도 "오늘"로 엽니다.
- **시장 상세 `/markets/{slug}`**: 다음 장날, 월간 장날 달력, 길찾기, 공유, 방문자가 알려 준 특산물·먹거리·이용 팁·볼거리를 보여 줍니다. 검수된 시장만 독립 URL과 sitemap에 들어가고, 나머지는 홈 지도 선택 상태로 엽니다.
- **지역별 장날 `/jangnal`**: 전국 허브, `/jangnal/{시·도 영문 슬러그}`, `/jangnal/days/{1-6|2-7|3-8|4-9|5-10}`이 있습니다. 시·도 페이지는 운영 중인 정기 장날 시장이 20곳 이상인 곳만 공개하며, 소개 글·추천 장·방문 팁은 `src/lib/region-guide.ts`가 시장 데이터로 만듭니다.
- **영어 안내 `/en`, 영어 지도 `/en/map`**: 외국인 방문자용입니다. 17개 시·도 영문 이름으로 검색할 수 있고 시장명·주소는 한글 원문을 씁니다. `/en/map`은 `noindex`입니다.
- **기타**: `/onnuri`(온누리상품권), `/about`, `/report`, `/privacy`, `/terms`.

장날과 "오늘"은 모두 한국 날짜(Asia/Seoul) 기준이며 브라우저에서 계산합니다. 홈 화면에 추가(PWA) 안내 배너와 서비스 워커(`public/sw.js`)도 있습니다.

## 제보

제보는 두 갈래입니다.

1. **장 정보 제보** (`POST /api/submissions`): 시장 상세와 지도의 "알려 주기" 버튼으로 특산물·먹거리·이용 팁·볼거리를 받습니다. 검토 중 상태로 `market_highlight_submissions`에 저장하고 슬랙에 승인 요청을 보냅니다. 승인자가 슬랙 버튼을 누르면 `POST /api/slack/actions`가 `market_highlights`에 반영하고 스냅샷을 바로 다시 읽습니다. 승인된 메시지의 [삭제] 버튼으로 공개된 제보를 내릴 수 있습니다. IP당 10분에 5건으로 제한하고 같은 장의 중복 이름은 막습니다.
2. **정보 수정·불편 신고** (`/report` → `POST /api/report`): Nodemailer와 Gmail SMTP로 운영자 메일에 보냅니다. 이쪽은 DB에 저장하지 않으며, IP 기준 요청 제한이 아직 없습니다.

두 API 모두 허용된 Origin에서 온 요청만 받습니다. 운영 절차는 [제보 운영](docs/product/제보-운영.md)을 참고합니다.

## 방문 통계와 광고

방문자와 페이지뷰는 셀프호스트 Umami로 집계합니다. 대상은 `https://kmarketday.com`이고 로컬 접속은 집계하지 않습니다. 검색어와 필터가 담긴 URL 쿼리 문자열은 수집하지 않고 분석용 쿠키도 쓰지 않으며, 수집 내용은 `/privacy`에서 안내합니다.

AdSense는 승인 전이라 광고 요청을 만들지 않습니다. 사이트 연결은 루트 `ads.txt`와 `google-adsense-account` 메타 태그로만 확인합니다. 검증 순서는 [AdSense 승인 준비 검증](docs/verification/adsense-readiness-2026-09-21.md)에 있습니다.

## 테스트

PR을 올리기 전에 다음을 실행합니다. CI도 같은 검사를 하고, PostgreSQL을 띄워 마이그레이션·시드·검증까지 확인합니다.

```bash
pnpm test        # 전체 단위 테스트 + scripts 테스트
pnpm typecheck
pnpm build
pnpm --filter @jangnal-map/web exec playwright test
```

## 배포

`main`에 머지하면 배포됩니다. CI의 `test` job(테스트·타입 검사·DB 검증)과 `image` job(Docker 이미지 빌드·smoke test·Harbor에 커밋 SHA 태그로 게시)이 병렬로 돌고, 둘 다 성공하면 `deploy` job이 GitOps의 `apps/jangnal-map/web/manifests/` 이미지를 갱신하고 GitHub Release를 기록합니다. 테스트가 실패한 커밋은 이미지가 Harbor에 남아도 배포되지 않습니다. Argo CD(`jangnal-map` Application, 자동 Sync)가 GitOps 변경을 받아 K3s에 배포합니다. Release와 Actions 성공은 배포 요청까지의 기록이며, 실제 Pod 상태는 Argo CD에서 확인합니다.

요청은 NPMplus(TLS) → Traefik → Next.js 컨테이너로 들어옵니다. 예전 주소 `https://spamfam.kr`은 경로와 쿼리를 보존해 새 주소로 301 이동합니다.

PR마다 `VERSION`(네 자리, 예: `0.4.9.2`)을 올리고 `CHANGELOG.md`에 한국어로 변경 내용을 적습니다.

## 참고 문서

- [웹 배포 안내](apps/web/README.md): 컨테이너, K3s 런타임, Actions 권한, Release, DB 운영
- [PRD](docs/product/PRD.md), [서비스 설계](docs/product/서비스-설계.md), [기술 스택 결정](docs/product/기술스택-결정.md)
- [지역별 장날 랜딩 PRD](docs/product/2026-10-14-prd-region-landing.md), [영어 방문자 기획](docs/product/2026-09-28-english-traveler-plan.md)
- 검증 기록: [docs/verification](docs/verification/)
