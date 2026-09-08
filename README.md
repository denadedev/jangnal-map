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

## 사용자 제보 접수

시장 정보 수정과 서비스 불편 신고는 오늘장날의 `/report` 화면에서 받고 `/api/report`가 Nodemailer와 Gmail SMTP를 통해 운영자 이메일로 전달합니다. 제보 데이터베이스는 사용하지 않습니다.

전용 Google 계정에서 2단계 인증을 켜고 앱 비밀번호를 발급합니다. 일반 로그인 비밀번호는 사용하지 않습니다. 로컬 `apps/web/.env.local`과 Vercel Production에 `SMTP_USER`, `SMTP_PASS`를 저장합니다. 수신 주소가 발신 Gmail과 다르면 `REPORT_TO_EMAIL`도 설정합니다.

`SMTP_PASS`는 브라우저에 노출되지 않으며 저장소나 채팅에 기록하지 않습니다. SMTP 설정이 없으면 지도와 시장 탐색은 작동하지만 제보 제출은 비활성화됩니다. Production에서는 실제 제보 한 건을 보내 운영자 이메일 도착과 메일 라벨 적용을 확인한 뒤 테스트 제보를 삭제합니다.

공개 전에 Vercel Dashboard의 Firewall에서 `POST /api/report`에 IP 기준 고정 구간 요청 제한을 설정합니다. 기준은 IP당 10분에 5건이며 초과 요청에는 기본 429 응답을 사용합니다. 이 규칙이 게시되지 않은 상태에서는 제보 기능을 Production에 공개하지 않습니다.

## Vercel 배포 준비

Vercel에서 이 저장소를 연결한 뒤 Root Directory를 `apps/web`으로 지정합니다. `apps/web/vercel.json`은 메일 전송 함수를 서울 리전에서 실행하도록 설정합니다. 필요할 경우 Production 환경 변수 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`, `SMTP_USER`, `SMTP_PASS`, `REPORT_TO_EMAIL`을 추가합니다. 지도 키 없이도 목록 대체 흐름은 배포할 수 있습니다.

배포 전에는 다음 검증을 실행합니다.

```bash
pnpm test
pnpm typecheck
pnpm build
```
