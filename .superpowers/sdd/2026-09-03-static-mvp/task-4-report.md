# Task 4 보고서: 로컬 브라우저 검증과 배포 전 준비

## 결과

완료. Vercel 배포는 실행하지 않았다.

## 실행 및 검증

- `pnpm test`: 통과, 11개 테스트 파일과 41개 테스트
- `pnpm typecheck`: 통과
- `pnpm build`: 통과
- 로컬 Next.js production 서버에서 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID` 없이 검증
- 1440px: 목록 대체, 평택 검색, 통복시장 선택, 다음 장날, 출처, 직접 날짜, 검색 결과 없음과 복구를 확인
- 375px: 검색·필터·상세를 확인했고 가로 오버플로우가 없음을 확인
- 모든 브라우저 확인 시 콘솔 오류 없음

## 발견한 문제와 수정

모바일 375px에서 날짜 입력이 필터 버튼과 한 가로 스크롤 행을 공유해 끝부분이 잘렸다. `apps/web/src/app/globals.css`의 모바일 규칙에서 날짜 입력을 전체 폭의 다음 행으로 이동했다. 수정 뒤 production build와 375px 상세 흐름을 다시 확인했다.

## 생성물

- `apps/web/.env.example`: 선택형 NAVER Maps 환경 변수 예시
- `README.md`: 설치, 데이터 생성, 개발/프로덕션 실행, 키 설정, Vercel 설정 안내
- `outputs/정적-MVP-검증결과.md`: 검증 표와 스크린샷 경로
- `outputs/screenshots/`: 데스크톱·모바일 검증 스크린샷

## 배포 전 우려 사항

- NAVER 지도 SDK를 실제로 표시하려면 운영 NAVER Maps client ID가 필요하다. 이번 범위에서는 키 없는 목록 대체 흐름만 검증했다.
- Vercel에서는 Root Directory를 `apps/web`으로 지정하고, 지도를 쓸 경우 `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`를 Production 환경 변수로 등록해야 한다.

## 증빙 보정 (fix round 1)

로컬 production 서버를 다시 열어 실제 1440 × 900 viewport로 상태별 스크린샷을 저장했다. `file` 메타데이터는 아래 6개 파일이 모두 `PNG image data, 1440 x 900`임을 확인했다.

- `outputs/screenshots/desktop-initial-1440.png`: 키 없는 지도 대체와 목록
- `outputs/screenshots/desktop-search-1440.png`: 평택 검색
- `outputs/screenshots/desktop-selected-1440.png`: 통복시장 상세·다음 장날·출처
- `outputs/screenshots/desktop-direct-date-1440.png`: 2026-09-08 직접 날짜
- `outputs/screenshots/desktop-no-results-1440.png`: 없는지역 빈 상태
- `outputs/screenshots/desktop-recovery-1440.png`: 검색어 지우기 후 목록 복구

새 캡처에서 콘솔 오류는 없었다. `.gitignore`의 `.gstack/` 줄은 이 Task 4에서 추가하지 않았으므로 변경하지 않았다.

## 최종 보정 (static MVP final fix)

`desktop-initial-1440.png`를 다시 확인한 결과, 이전 캡처는 목록 높이가 전체 grid를 늘려 대체 메시지가 첫 viewport 아래에 있어 설명과 일치하지 않았다. 데스크톱 explorer shell을 viewport 높이로 제한한 뒤 로컬 production에서 다시 캡처했다. 현재 증빙은 실제 1440 × 900 초기 viewport 중앙에 “지도 없이도 시장을 찾을 수 있어요” 메시지를 표시한다.

768px에서는 직접 날짜 입력을 필터 pill 다음 행으로 배치했다. `2026-09-08` 입력이 가능하고 URL이 `?when=date&date=2026-09-08`으로 반영되는 것을 `outputs/screenshots/tablet-direct-date-768.png`에서 확인했다.
