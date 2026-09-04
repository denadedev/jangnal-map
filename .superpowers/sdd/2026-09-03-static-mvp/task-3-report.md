# Task 3 완료 보고서 — 지도·검색·필터·상세 UI

작성일: 2026-09-05
상태: 완료

## 인계받은 상태

이전 작업자가 Task 3의 정적 MVP UI를 구현하고 웹 테스트 12개를 통과시킨 상태에서 중단되었다. 작업 트리에는 지도 탐색 컴포넌트, NAVER Maps 로더, 필터·목록·상세 UI, 컴포넌트 테스트, Vitest 설정과 의존성 변경이 커밋되지 않은 채 남아 있었다.

승인 문서 `docs/product/서비스-설계.md`와 `docs/product/정적-MVP-결정.md`를 기준으로 범위를 확인했다. 이 작업은 정적 `markets.json`을 브라우저에서 탐색하는 MVP이며, 백엔드·DB·제보 저장·배포는 포함하지 않는다.

## 구현 및 마감 변경

- `MarketExplorer`가 TanStack Query로 `/data/markets.json`을 읽고, 검색어·날짜 조건·선택 시장을 URL 파라미터와 동기화한다.
- 오늘·이번 주·주말·직접 날짜 필터, 시장명·지역 검색, 결과 없음 초기화, 목록 선택과 상세 패널을 구현했다.
- NAVER Maps SDK 로더와 사용자 정의 `시장명 · M/D` 마커를 구현했다. API 키가 없거나 SDK 로드에 실패하면 목록 탐색을 계속할 수 있는 대체 지도를 표시한다.
- 데스크톱의 좌측 목록/중앙 지도/우측 상세 패널과 모바일 하단 상세 시트를 반응형 CSS로 구현했다.
- 상세에는 다음 장날, 월간 장날, 유형·주소·전화·주차, 출처·기준일, NAVER 길찾기 링크를 표시한다.
- 지도 마커의 `tabindex=-1`을 제거하고 접근성 이름을 추가해 키보드 사용자가 포커스할 수 있게 했다.
- Next 16 기본 Turbopack 빌드는 CSS 처리 중 `binding to a port: Operation not permitted`로 실패했다. 동일 실패를 권한 환경에서도 재현했고, 앱 코드 문제가 아님을 확인했다. `apps/web`의 프로덕션 빌드 스크립트를 공식 Webpack 경로(`next build --webpack`)로 변경해 실제 프로덕션 빌드가 완료되도록 했다.

## 검증 근거

2026-09-05에 아래 명령을 새로 실행했다.

| 명령 | 결과 |
| --- | --- |
| `pnpm test` | 성공 — web 12개 + data-audit 25개, 총 37개 테스트 통과 |
| `pnpm typecheck` | 성공 — web `next typegen && tsc --noEmit`, data-audit `tsc --noEmit` 통과 |
| `pnpm build` | 성공 — `next build --webpack`, 컴파일·타입 검사·정적 페이지 생성 완료 |
| `pnpm --filter @jangnal-map/web exec next start --port 3100` + `curl` | 성공 — 프로덕션 서버가 `오늘 장날`, 검색 입력 레이블, 서비스 설명을 제공함을 확인 후 서버 종료 |
| `git diff --check` | 성공 — 공백 오류 없음 |

추가 테스트는 사용자 요청에 따라 늘리지 않았다. 상속받은 필터·선택·URL·NAVER 키 누락 대체 화면 테스트는 보존했다.

## Task 3 파일

- `apps/web/package.json`, `pnpm-lock.yaml`: TanStack Query·테스트 의존성 및 Webpack 프로덕션 빌드 스크립트
- `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`: 탐색 화면 진입점 및 반응형 스타일
- `apps/web/src/components/market-explorer.tsx`: 데이터 로드·URL 상태·화면 조합
- `apps/web/src/components/market-map.tsx`: 지도 SDK/마커/대체 화면
- `apps/web/src/components/market-filters.tsx`: 검색과 날짜 필터
- `apps/web/src/components/market-list.tsx`: 결과 목록·빈 상태
- `apps/web/src/components/market-detail.tsx`: 상세 패널·길찾기·출처
- `apps/web/src/lib/market-view.ts`: UI용 날짜·검색 형식화
- `apps/web/src/lib/naver-maps.ts`: SDK 타입 및 스크립트 로더
- `apps/web/src/components/*.test.tsx`, `apps/web/src/test/setup.ts`, `apps/web/vitest.config.ts`: 상속받은 컴포넌트 테스트 기반

## 남은 고려 사항

- 실제 NAVER Maps 키를 주입한 환경에서 지도 SDK와 마커를 브라우저로 최종 확인해야 한다. 키 미설정/SDK 실패 시 목록 대체 동작은 컴포넌트 테스트로 검증됐다.
- Turbopack의 포트 바인딩 실패는 이 환경에서 앱 코드와 무관하게 재현됐다. 현재는 Webpack 빌드를 사용한다. Next.js 또는 Turbopack 업데이트 후 기본 빌드 경로를 다시 확인할 수 있다.
- 승인된 정적 MVP 범위에 따라 사용자 제보 저장, API·DB, 배포 작업은 수행하지 않았다.

## 수정 라운드 1 — 2026-09-05

### 수정 사항

- `이번 주` 범위를 월요일~일요일에서 오늘~일요일로, `주말` 범위를 오늘과 토요일 중 더 늦은 날~일요일로 변경했다. 필터와 핀·목록·상세가 모두 동일한 범위 시작일을 기준으로 다음 장날을 계산하므로, 화면에 보이는 날짜가 활성 필터 밖의 과거 장날이 되지 않는다.
- 직접 날짜는 잘못된 달력 날짜, 빈 값, 오늘 이전 날짜를 오늘로 정규화했다. 날짜 입력에는 오늘을 `min`으로 제공하고 URL 초기 상태도 같은 정규화를 거친다. 이로써 과거 날짜에서 발생하던 음수 D-day 표기를 막았다.
- 필터 결과에서 선택 시장이 사라지면 상세 패널과 URL의 `market` 선택값을 함께 해제한다.
- NAVER SDK 로더는 오류·SDK 미노출·10초 시간 초과 시 이벤트 리스너와 실패 스크립트를 제거하고 Promise를 초기화한다. 다음 로드는 새 스크립트를 추가하므로 실패 후 재시도가 멈추지 않는다.

### 추가 회귀 검증

- `market-view.test.ts`: 주중 과거 장날을 건너뛰고 활성 주 범위 안의 다음 장날만 표시하는지, 빈·형식 오류·과거 직접 날짜가 오늘로 보정되는지 확인했다.
- `naver-maps.test.ts`: SDK 오류 뒤 실패 스크립트가 제거되고 재시도 때 새 스크립트가 생성되는지 확인했다.
- `market-explorer.test.tsx`: 선택한 시장이 검색 필터에서 제외될 때 상세와 URL 선택값이 제거되는지 확인했다.

### 수정 라운드 검증 근거

| 명령 | 결과 |
| --- | --- |
| `pnpm --filter @jangnal-map/web test` | 성공 — 5개 파일, 16개 테스트 통과 |
| `pnpm --filter @jangnal-map/web typecheck` | 성공 — `next typegen && tsc --noEmit` 통과 |
| `pnpm --filter @jangnal-map/web build` | 성공 — Webpack 프로덕션 컴파일·타입 검사·정적 페이지 생성 완료 |
| `pnpm --filter @jangnal-map/web exec next start --port 3101` + `curl` | 성공 — 기본 HTML에서 서비스명·검색 입력 레이블·서비스 설명을 확인한 뒤 서버 종료 |
