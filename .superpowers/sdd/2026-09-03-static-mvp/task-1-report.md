# Task 1 구현 보고서 — 공개 시장 JSON 생성

## 구현 내용

- `generatePublicMarkets(rawRows, normalizedRows): PublicMarket[]` 생성기를 추가했다.
- 기존 `isPublishableMarket` 판정(주기형 장날, 파싱 가능한 5일 간격 규칙, 유효한 국내 좌표)을 재사용해 게시 대상만 남긴다.
- 공개 일정은 `parseSchedule` 결과를 사용하며, `5일+10일`의 두 번째 끝값 `10`을 달력용 `0`으로 변환한다.
- 공개 레코드에는 시장명·시장 유형·주소·좌표·원문 일정·정규화 일정·전화·주차·운영 상태·원천 정보를 포함한다.
- `generate` 스크립트로 공식 EUC-KR CSV에서 `apps/web/public/data/markets.json`을 생성할 수 있게 했다.

## TDD 증거

### RED

먼저 fixture 테스트를 작성하고 다음 명령을 실행했다.

```text
pnpm test -- generate-public-markets.test.ts
```

실패 결과:

```text
FAIL test/generate-public-markets.test.ts
Error: Cannot find module '../src/generate-public-markets.js'
Test Files 1 failed | 5 passed (6)
Tests 22 passed (22)
```

이는 생성기 모듈이 아직 존재하지 않아 테스트가 의도한 기능 부재로 실패한 결과다. 테스트는 `5일+10일` fixture 행이 게시되고 `[5, 0]`이 되는지, `매일` 행은 제외되는지를 검증하도록 작성했다.

### GREEN

생성기 구현 후 다음 focused 명령이 통과했다.

```text
pnpm test -- generate-public-markets.test.ts
```

결과: Test Files 6 passed (6), Tests 23 passed (23)

```text
pnpm typecheck
```

결과: `tsc --noEmit` 종료 코드 0

## 공식 데이터 생성 및 불변조건

생성 명령:

```text
pnpm generate --input data/raw/markets.csv --encoding euc-kr --output ../../apps/web/public/data/markets.json
```

결과:

```json
{"rows":400,"output":"../../apps/web/public/data/markets.json"}
```

생성 JSON에 대해 별도 Node 검사를 실행했다.

```text
{"count":400,"badCoord":0,"badSchedule":0,"badTen":0}
```

- 레코드 수: 400
- null/비유효 좌표: 0
- unknown 또는 비정형 일정: 0
- `5일+10일` 중 `[5,0]`이 아닌 행: 0

## 전체 검증

```text
pnpm test
```

결과: Test Files 6 passed (6), Tests 23 passed (23)

```text
pnpm typecheck
```

결과: `tsc --noEmit` 종료 코드 0

```text
git diff --check
```

결과: whitespace 오류 없음

## 변경 파일

- `work/data-audit/src/generate-public-markets.ts`
- `work/data-audit/test/generate-public-markets.test.ts`
- `work/data-audit/package.json`
- `apps/web/public/data/markets.json`
- `.superpowers/sdd/2026-09-03-static-mvp/task-1-report.md`

구현 커밋: `9b59a3f feat: generate static public market data`

## Self-review

- 게시 대상 필터는 기존 감사 로직과 동일한 판정 함수를 사용한다.
- 좌표와 일정은 타입 및 런타임 재검사로 공개 데이터에 누락이 들어가지 않도록 했다.
- 생성기는 백엔드/API/DB 코드를 추가하지 않고 정적 산출물만 생성한다.
- 원본 행과 정규화 행은 인덱스로 대응하며, 대응하는 원본 행이 없는 정규화 행은 공개하지 않는다.
- 기존 작업 중인 문서 변경은 커밋에 포함하지 않았다.

## 우려사항

- 기존 감사 보고서 생성 로직의 조사일이 하드코딩되어 있어 감사 산출물의 조사일은 `2026-09-02`로 표시된다. 데이터 생성 및 품질 수치에는 영향이 없다.
- `tsx` 실행은 샌드박스에서 IPC pipe 권한 오류가 발생해 승인된 실행으로 수행했다.

## 리뷰 수정 라운드 1

### 추가 변경

- `PublicMarket.id`를 추가했다. 시장명·도로/지번 주소·좌표·원문 일정으로 만든 SHA-256 앞 16자리 해시(`market-<hex>`)라 배열 순서와 무관하게 결정적이다.
- 생성기 API를 `generatePublicMarkets(rawRows)`로 단일화하고 내부에서 각 원본 행을 정규화한다. raw/normalized 인덱스 불일치 가능성을 제거했다.
- 커밋 산출물 계약 테스트를 추가해 400개, 고유/비어 있지 않은 ID, 유효 좌표, digit-pair 일정, 5일+10일 변환을 자동 검증한다.

### 수정 TDD 증거

RED 명령:

```text
pnpm test -- generate-public-markets.test.ts
```

수정 테스트 직후 실패:

```text
Tests 3 failed (25)
TypeError: Cannot read properties of undefined (reading 'flatMap')
expected 1 to be 400
```

첫 두 실패는 기존 2-인자 구현에 raw-only 테스트를 적용했기 때문이며, 세 번째는 기존 산출물에 ID가 없어 계약을 위반했기 때문이다.

GREEN 명령 및 결과:

```text
pnpm generate --input data/raw/markets.csv --encoding euc-kr --output ../../apps/web/public/data/markets.json
{"rows":400,"output":"../../apps/web/public/data/markets.json"}

pnpm test
Test Files 6 passed (6)
Tests 25 passed (25)

pnpm typecheck
tsc --noEmit 종료 코드 0

git diff --check
whitespace 오류 없음
```

커밋 산출물 계약 테스트에서 다음을 확인했다: `count=400`, 고유 ID 400개, 빈 ID 0개, 유효하지 않은 좌표 0개, digit-pair 이외 일정 0개, 지원되지 않는 날짜 끝값 0개, `5일+10일` 변환 오류 0개.

수정 커밋: `ebebecf fix: harden static market artifact contract`
