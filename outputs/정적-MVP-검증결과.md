# 정적 MVP 검증 결과

검증일: 2026-09-06

환경: 로컬 Next.js production build, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` 미설정, Chromium 브라우저

## 자동 검증

| 명령 | 결과 |
| --- | --- |
| `pnpm --filter jangnal-market-data-audit generate -- --input data/raw/markets.csv --encoding euc-kr --output ../../apps/web/public/data/markets.json` | 통과: 공개 시장 데이터 400건 생성 |
| `pnpm --filter @jangnal-map/web test` | 통과: 5개 테스트 파일, 16개 테스트 |
| `pnpm typecheck` | 통과 |
| `pnpm build` | 통과: Next.js production build |

## 브라우저 검증

| 흐름 | 결과 | 증빙 |
| --- | --- | --- |
| 1440px 초기 화면과 키 없는 지도 대체 | 통과: 지도 SDK 대신 목록 탐색 안내를 표시하고 시장 목록을 렌더링 | `outputs/screenshots/desktop-initial-1440.png` |
| 1440px 평택 검색 | 통과: 평택 검색 결과 2건을 표시 | `outputs/screenshots/desktop-search-1440.png` |
| 1440px 통복시장 선택 → 다음 장날·출처 | 통과: 상세, 다음 장날, 공공데이터포털 출처를 표시 | `outputs/screenshots/desktop-selected-1440.png` |
| 1440px 직접 날짜 | 통과: 2026-09-08 직접 날짜가 URL 상태에 반영됨 | `outputs/screenshots/desktop-direct-date-1440.png` |
| 1440px 검색 결과 없음 | 통과: `없는지역` 검색 시 빈 상태를 표시 | `outputs/screenshots/desktop-no-results-1440.png` |
| 1440px 검색 복구 | 통과: 검색어 지우기 후 날짜 목록을 다시 표시 | `outputs/screenshots/desktop-recovery-1440.png` |
| 375px 검색과 필터 | 통과: 평택 검색 결과 2건, 가로 오버플로우 없음 | `outputs/screenshots/mobile-search-375.png` |
| 375px 시장 선택과 상세 | 통과: 상세·다음 장날·출처를 표시하고 가로 오버플로우 없음 | `outputs/screenshots/mobile-selected-375-fixed.png` |
| 768px 직접 날짜 | 통과: 날짜 입력이 필터 아래 행에 표시되고 2026-09-08 입력 및 URL 반영 | `outputs/screenshots/tablet-direct-date-768.png` |

모든 확인 시점에서 브라우저 콘솔 오류는 없었습니다. 네트워크 요청은 HTML, Next 정적 자산 및 `/data/markets.json`에서 모두 200 응답을 받았습니다.

`desktop-initial-1440.png`는 실제 1440 × 900 초기 viewport에서 중앙의 “지도 없이도 시장을 찾을 수 있어요” 대체 메시지가 보이는 캡처로 다시 저장했습니다.

## 발견·수정

375px에서 날짜 입력이 필터 버튼과 같은 가로 스크롤 행 끝에 놓여 일부가 잘렸습니다. `apps/web/src/app/globals.css`에서 모바일 날짜 입력을 자체 행으로 배치해 버튼과 입력이 모두 보이도록 수정했습니다. 수정 후 production build와 모바일 재검증을 완료했습니다.

## 배포 전 확인 사항

- `vercel.json`은 불필요합니다. Vercel Root Directory는 `apps/web`으로 설정합니다.
- 지도 표시가 필요하면 Production 환경 변수 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 등록합니다.
- 키를 등록하지 않아도 검증한 목록 대체 흐름으로 서비스할 수 있습니다.
- 이 검증에서는 Vercel 배포 명령을 실행하지 않았습니다.
