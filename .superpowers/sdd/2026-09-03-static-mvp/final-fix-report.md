# Static MVP final-fix report

검증일: 2026-09-06

## 완료한 수정

- README의 데이터 생성 명령을 data-audit 작업 디렉터리 기준 경로로 수정했다.
  - 입력: `data/raw/markets.csv`
  - 출력: `../../apps/web/public/data/markets.json`
- 701px~980px tablet 범위에서 직접 날짜 입력을 숨기지 않고 filter pills 아래 행으로 배치했다.
- `/` 페이지에서 server `searchParams` 대기를 제거했다. URL의 검색어·날짜·선택 시장 상태는 hydration 뒤 client effect에서 복원하므로 페이지는 정적으로 prerender된다.
- `apps/web/.env*.local`을 gitignore에 추가했고 `apps/web/.env.example`은 계속 추적된다.
- 데스크톱 shell 높이를 viewport로 고정해 키 없는 지도 fallback이 첫 viewport의 중앙에 표시되도록 했다.

## 명령 검증

| 명령 | 결과 |
| --- | --- |
| `pnpm --filter jangnal-market-data-audit generate -- --input data/raw/markets.csv --encoding euc-kr --output ../../apps/web/public/data/markets.json` | 통과. 400행 생성 |
| `pnpm --filter @jangnal-map/web test` | 통과. 5개 파일, 16개 테스트 |
| `pnpm typecheck` | 통과 |
| `pnpm build` | 통과. Next build route 표에서 `/`가 `○ (Static)` |

## 브라우저 검증

- 로컬 production 서버, NAVER Maps client ID 없이 확인했다.
- 1440 × 900: `outputs/screenshots/desktop-initial-1440.png`에서 “지도 없이도 시장을 찾을 수 있어요” fallback이 map stage 중앙에 보인다. 측정된 message와 stage의 세로 중앙은 동일했다.
- 768 × 1024: `outputs/screenshots/tablet-direct-date-768.png`에서 직접 날짜 입력이 filter pills 아래에 표시된다. `2026-09-08`을 입력했으며 URL은 `?when=date&date=2026-09-08`으로 변경됐다. document `scrollWidth`와 `clientWidth`는 모두 768이었다.
- Deep link `/?q=평택&when=date&date=2026-09-08`은 hydration 뒤 검색어 “평택”, 날짜 “2026-09-08”, “날짜 선택” mode로 복원됐다.
- 브라우저 콘솔 오류는 없었다.

## 범위 외 우려

- 실제 NAVER 지도 렌더링은 여전히 배포 환경의 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`가 있어야 한다. 이번 검증은 의도대로 키 없는 목록 fallback을 확인했다.
- Vercel 명령은 실행하지 않았다.
