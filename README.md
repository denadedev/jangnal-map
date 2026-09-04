# 오늘 장날

전국 전통시장 장날을 정적 데이터로 탐색하는 Next.js MVP입니다. NAVER Maps 키가 없거나 지도 SDK를 불러오지 못해도 시장 목록, 검색, 날짜 필터와 상세 정보는 사용할 수 있습니다.

## 설치

```bash
pnpm install
```

## 시장 데이터 생성

원본 CSV를 준비한 뒤 다음 명령으로 공개용 정적 데이터를 만듭니다. `--encoding`에는 원본 파일에 맞춰 `utf8` 또는 `euc-kr`을 지정합니다.

```bash
pnpm --filter jangnal-market-data-audit generate -- \
  --input work/data-audit/data/raw/markets.csv \
  --encoding euc-kr \
  --output apps/web/public/data/markets.json
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

## Vercel 배포 준비

별도 `vercel.json`은 필요하지 않습니다. Vercel에서 이 저장소를 연결한 뒤 Root Directory를 `apps/web`으로 지정하고, 필요할 경우 Production 환경 변수 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 추가합니다. 키 없이도 목록 대체 흐름은 배포할 수 있습니다.

배포 전에는 다음 검증을 실행합니다.

```bash
pnpm test
pnpm typecheck
pnpm build
```
