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

전용 Google 계정에서 2단계 인증을 켜고 앱 비밀번호를 발급합니다. 일반 로그인 비밀번호는 사용하지 않습니다. 로컬에서는 `apps/web/.env.local`, K3s에서는 `jangnal-map` namespace의 `jangnal-web-env` Secret에 `SMTP_USER`, `SMTP_PASS`를 저장합니다. 수신 주소가 발신 Gmail과 다르면 `REPORT_TO_EMAIL`도 설정합니다.

`SMTP_PASS`는 브라우저에 노출되지 않으며 저장소나 채팅에 기록하지 않습니다. SMTP 설정이 없으면 지도와 시장 탐색은 작동하지만 제보 제출은 비활성화됩니다. Production에서는 실제 제보 한 건을 보내 운영자 이메일 도착과 메일 라벨 적용을 확인한 뒤 테스트 제보를 삭제합니다.

제보 API의 IP 기준 요청 제한은 아직 미구현입니다. 목표는 IP당 10분에 5건, 초과 시 429이며, 프록시의 실제 클라이언트 IP 신뢰 설정과 함께 별도로 적용해야 합니다. CI/CD 성공이 이 보호 조치의 완료를 뜻하지 않습니다.

## K3s 배포와 Release

`main` 반영 → CI 테스트·이미지 검증 → Harbor 게시 → GitOps 이미지 갱신 → GitHub Release 생성 순서입니다. Argo CD가 GitOps 변경을 감지해 K3s에 배포합니다. Release는 **배포 요청 완료 기록**이며 실제 Pod 배포 완료를 보장하지 않습니다.

서비스 경로는 `jangnal.spamfam.kr` → NPMplus(TLS) → Traefik → Next.js 컨테이너입니다. Vercel Git 연결은 해제했고 기존 프로젝트는 일시 중지 상태입니다. 환경변수·권한·재실행·롤백 안내는 [웹 배포 안내](apps/web/README.md)를 참고합니다.

배포 전에는 다음 검증을 실행합니다.

```bash
pnpm test
pnpm typecheck
pnpm build
```
