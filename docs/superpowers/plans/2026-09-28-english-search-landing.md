# 영어 안내·기본 시장 탐색 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation. Use superpowers:subagent-driven-development only if the user explicitly selects delegation. Checkboxes track each step.

**Goal:** 영어 검색으로 들어온 방문자가 `/en` 안내를 읽고 `/en/map`에서 영어 시·도 검색과 한국 기준 장날로 시장을 찾으며, 버튼 하나에서 지도 서비스를 선택하게 한다.

**Architecture:** App Router에 정적 `/en` 안내와 기존 `MarketExplorer`를 재사용하는 `/en/map`을 추가한다. 기존 UI 컴포넌트에 `locale: "ko" | "en"`을 전달하고, 고정 문구는 작은 타입 지정 번역 객체에 모은다. 영어 지역 별칭은 시·도에만 대응시키며 한국 날짜를 기존 일정 함수에 전달한다. 시장 원본 데이터와 한국어 시장 상세 경로는 유지한다.

**Tech Stack:** 기존 Next.js 16, React 19, TypeScript, CSS Modules, Vitest, Playwright. 신규 패키지 없음.

**Spec:** `docs/product/2026-09-28-english-traveler-plan.md`.

## 전체 제약

- 사용자의 최신 범위는 영어 안내 페이지와 기본 메뉴·시장 탐색 내용의 번역이다.
- 시장 고유명사·주소·원문 출처·30곳 편집 콘텐츠는 번역하지 않는다.
- 한국어 화면·URL·API·데이터를 그대로 사용할 수 있어야 한다.
- 17개 시·도 영문 검색과 한국 날짜 기준은 사용자 선택 C안에 포함된다. 영어 시장 이름 검색·영어 독립 시장 상세는 제외한다.
- 한글 시장 고유명사를 영어 안내에서 정직하게 설명한다.
- 지도 진입 동작은 한 버튼이다. NAVER는 경로, Google은 좌표 위치만 보장한다고 각각 표시한다. Google 지도 API·키는 사용하지 않는다.
- 사용자가 후속 턴에서 구현을 승인했다. 이 계획의 코드는 로컬 브랜치에서 구현하고 배포는 별도 요청에서 진행한다.

## 파일과 책임

| 파일 | 책임 |
| --- | --- |
| Create `apps/web/src/lib/locale.ts` | `Locale = "ko" | "en"`, locale별 지도 경로와 선택 상태 URL 직렬화 |
| Create `apps/web/src/lib/ui-copy.ts` | 공통 메뉴·필터·목록·지도·상세·공유의 타입 지정 번역 문구 및 날짜 표시 함수 |
| Create `apps/web/src/lib/region-aliases.ts` | 17개 시·도 영문 표기와 원본 한글 행정구역 검색 매핑 |
| Create `apps/web/src/lib/korea-date.ts` | 현재 시각을 Asia/Seoul 달력 날짜로 변환 |
| Create `apps/web/src/app/en/page.tsx`, `page.module.css` | 날짜·지역 탐색 가치를 보여 주는 정적 영어 안내·메타데이터 |
| Create `apps/web/src/app/en/map/page.tsx` | 기존 지도에 `locale="en"`과 영어 SEO 정책 전달 |
| Modify `apps/web/src/app/page.tsx` | 기존 지도에 명시적 `locale="ko"` 전달 |
| Modify `apps/web/src/components/market-explorer.tsx` | locale별 문구·하위 props·주소 상태 유지 |
| Modify `apps/web/src/components/market-filters.tsx`, `market-list.tsx`, `market-map.tsx`, `mobile-market-sheet.tsx`, `market-detail.tsx` | 화면·오류·접근성 문구 번역 |
| Modify `apps/web/src/components/mobile-app-bar.tsx`, `mobile-menu.tsx`, `site-footer.tsx` | 언어 전환 및 메뉴 링크의 언어 표시 |
| Modify latest-main `apps/web/src/components/mobile-home-controls.tsx`, `market-preview.tsx` | 최신 모바일 첫 화면의 영어 문구·선택 흐름 |
| Modify `apps/web/src/components/market-share-button.tsx`, `onnuri-summary.tsx` | 영어 버튼·피드백·요약 안내 |
| Create `apps/web/src/components/market-directions-menu.tsx` | 한 개의 지도 선택 버튼과 NAVER 경로·Google 위치 링크 |
| Modify `apps/web/src/app/markets/[slug]/page.tsx` | 한국어 독립 상세도 같은 지도 선택 컴포넌트 사용 |
| Modify `apps/web/src/lib/market-view.ts`, `apps/web/src/lib/naver-maps.ts` | 영어 시·도 검색과 사용자에게 보이는 날짜·일정·지도 오류 문구. 한국어 검색 유지 |
| Modify `apps/web/src/app/sitemap.ts`, `README.md` | 영어 안내 등록·운영 문서 |
| Create `apps/web/e2e/english-experience.spec.ts` | 영어 안내에서 지도 탐색·공유·모바일 흐름 검증 |

파일 경로는 현재 컴포넌트 구조를 따른다. 구현 중 번역 문구가 한 컴포넌트에만 쓰이면 그 컴포넌트에 둬도 되지만, 언어별로 같은 문자열을 복제하지 않는다.

## Task 0 — 최신 main 기준 맞추기

- [ ] 현재 작업 트리의 HEAD는 `origin/main`보다 한 커밋 뒤이며, 그 커밋이 모바일 지도 첫 화면의 `MarketExplorer`·`MarketFilters`·`MarketMap`·`MobileMarketSheet`를 크게 수정했다. 구현용 작업 트리를 최신 main에 맞춘 뒤 관련 파일과 테스트 이름을 다시 읽는다. 기존 미커밋 기획 문서는 보존한다.
- [ ] 최신 main의 `MobileHomeControls`, `MarketPreview`, 지도 선택의 preview/detail 상태, 모바일 뒤로 가기 흐름을 이 계획의 영어 문구와 URL 유지 대상에 포함한다. 명시적 근거 없이 이전 버전으로 되돌리지 않는다.
- [ ] 이 작업은 리뷰 단계에서 실행하지 않는다. 구현을 시작할 때 첫 검증 단계로 수행한다.

## Task 1 — 영어 안내와 진입점

**Interfaces:** `/en`은 서버 렌더링된 영어 본문, CTA는 `/en/map`. `<main lang="en">`을 사용하고 한글 예시에 `lang="ko"` 지정.

- [ ] `/en`의 실제 영어 본문을 작성한다: 날짜·지역별 시장 탐색의 가치 다음에 `Why visit on market day?`를 배치하고, 장날에는 추가 판매자가 모여 물품 선택지와 구경거리가 풍성해질 수 있음을 설명한다. 이어 상설시장(permanent market)과 장날(market day)의 차이와 겹침, 5일장 2·7일 예시, 지도 이용 단계, 일정·영업시간 주의, 한글 시장명·주소와 Korea time 기준 안내를 배치한다. 기획서의 짧은 영문 문안을 출발점으로 쓰고 일반 관광 소개만 되풀이하지 않는다.
- [ ] 영어 title `Find Korean Traditional Market Days by Date`, 영어 description, canonical `/en`, Open Graph locale `en_US`와 URL `/en`을 설정한다. 현재 루트 제목 템플릿의 한국어 접미사가 실제 출력에 붙는지 확인하고 붙으면 `/en`에서 절대 제목을 사용한다.
- [ ] 기존 한국어 메뉴·푸터에서 English 링크를 제공한다. 새 `/en` 본문의 지도 버튼은 `/en/map`으로 보낸다.
- [ ] sitemap에 `/en`만 한 번 추가한다. `/en/map`은 목록형 탐색 도구이므로 sitemap에서 제외한다.
- [ ] JavaScript 비활성 상태에서도 `/en`의 H1·설명·지도 링크가 HTML에 존재하는지 검증한다.
- [ ] 영어 본문에서 상설 점포가 있는 시장에도 정기 장날이 열릴 수 있으며 개별 점포의 영업은 보장되지 않는다는 문장을 확인한다. 장날의 더 많은 판매 물품·볼거리를 방문 동기로 전달하되 모든 시장에서 같은 규모·공연이 있다는 식으로 단정하지 않는다. 원본 데이터의 `상설장`+`digit-pair` 사례를 예로 들어 용어를 검토한다.

## Task 2 — 번역 경계와 영어 지도

**Interfaces:** `MarketExplorer`에 `locale?: Locale`을 추가하며 기본값은 `ko`. `getMapPath(locale)`은 한국어 `/`, 영어 `/en/map`을 반환한다. `buildExplorerPath(locale, { query, mode, directDate, marketId })`는 검색·필터·선택을 locale 경로의 URL로 만든다. `ui-copy.ts`는 locale별 같은 키를 갖는 객체를 제공한다. `getKoreaCalendarDate(now: Date): Date`는 `Asia/Seoul`의 연·월·일을 기존 일정 함수가 받는 달력 날짜로 변환한다. `resolveRegionAlias(query: string): readonly string[] | null`은 정규화한 영문 시·도명을 실제 데이터의 한글 주소 접두사 목록으로 연결한다.

- [ ] 번역 문구를 화면별로 정리하고 ko/en 키의 누락을 타입으로 잡는다. 장날·매일·확인 필요·다음 날짜는 한국어 기본 출력이 바뀌지 않도록 테스트한다.
- [ ] `/en/map` 서버 페이지에서 기존 지도 데이터 입력을 재사용하고 영어 metadata와 `robots: { index: false, follow: true }`, canonical `/en/map`을 지정한다. 영어 지도에서 한국어 소개 카드가 나타나면 숨기고 한국어 상세 링크는 `(Korean)`을 붙인다.
- [ ] Explorer의 URL 읽기·replaceState·pushState·뒤로 가기가 현재 locale 경로를 유지하도록 한다. latest main의 `mobileMarketView`, `mobileMarketSource`, `mobileReturnSnap` 상태를 보존한다. 검색어를 임의로 번역하지 않는다.
- [ ] 영어 목록 항목의 실제 `href`, 새 탭 열기, 공유 URL도 `/en/map`에 검색어·필터·직접 선택일·시장 ID를 보존한다. 한국어 목록과 검수 시장의 기존 독립 상세 링크는 유지한다. URL은 공통 `buildExplorerPath`에서 구성해 주소 갱신·목록·공유가 어긋나지 않게 한다.
- [ ] 공유 URL의 `date`가 한국 기준으로 지난 날이라 조정되거나 `market`이 없거나 필터 결과 밖이라 선택이 해제될 때, 영어 화면에 변경 이유를 알린다. 한국어의 기존 정규화 동작과 선택 해제는 유지한다.
- [ ] 영어 시·도 검색 별칭을 17개 지역에 매핑한다. `Seoul`, `Busan`, `Jeju`와 전북의 원본 표기 오류를 포함해 테스트한다. 별칭이 여러 실제 주소 접두사에 대응할 수 있으므로 반환 계약은 문자열 하나가 아닌 목록이다. 별칭 일치 시 접두사 매칭을 쓰고, 그 외 입력에는 기존 한글 검색을 유지한다. 영문 시장명은 검색 가능한 척하지 않는다.
- [ ] 영어 지도에서 Today·Next 7 days·This weekend·다음 장날에 전달할 오늘 날짜를 한국 시간으로 계산한다. 한국어 지도도 동일한 달력 기준을 사용해 언어 전환 결과가 바뀌지 않게 한다. 날짜 계산 함수의 기존 입력·출력 계약은 유지한다.
- [ ] KST 변환은 ‘한국의 연·월·일’을 한 번 추출해 기존 달력 계산 함수가 받는 로컬 달력 날짜로 만든다. 그 값을 다시 `Asia/Seoul` 시간대로 포맷해 하루를 중복 이동시키지 않는다. 직접 선택한 YYYY-MM-DD는 그대로 유지한다.
- [ ] 한국 자정에 Today 기준을 다시 계산하고, 백그라운드에서 타이머가 멈췄다가 탭이 다시 보일 때도 기준일을 갱신한다. 기존 선택 날짜는 사용자가 바꾸지 않는 한 유지한다.
- [ ] 영어 날짜 필터 문구는 기존 결과 의미를 정확히 표시한다. Today·Next 7 days·Weekend에서 상설시장 일부가 제외되는 현재 동작을 `Market days ...`와 `All markets` 안내로 설명한다. 필터 포함 로직 변경은 별도 결정이다.
- [ ] `daily` 일정의 영어 표시는 ‘점포 모두 현재 영업 중’이라는 뜻이 아니도록 한다. `marketType`과 `schedule.kind`를 같은 분류로 간주하지 않고 `상설장`이면서 `digit-pair`인 실제 시장을 테스트한다.
- [ ] 공통 필터·목록·지도·상세·모바일 시트·공유·온누리 요약의 버튼, 라벨, 빈/오류 상태, 접근성 문구를 번역한다. 시장명·주소·출처 이름은 한글을 유지한다. 한국어 화면의 기존 문구가 바뀌지 않도록 한다.
- [ ] `MarketShareButton`의 화면 버튼뿐 아니라 `navigator.share`에 전달하는 제목·본문과 클립보드 피드백도 영어 locale에 맞춘다. 한국어 공유 제목·본문과 검수된 독립 상세 URL은 기존대로 유지한다.
- [ ] 한국어로 연결되는 독립 시장 상세·제보·온누리 가이드·법률 링크에 `(Korean)`을 표기한다. 영어 화면에서 시장을 공유하면 `/en/map?market=...` 경로를 사용한다.
- [ ] 영어 검색창에 영문 시·도 또는 한글 시장명을 입력할 수 있다고 설명한다. 특정 시장의 영문명 검색은 아직 지원한다고 주장하지 않는다.
- [ ] `MarketDirectionsMenu({ market, locale })`를 만들어 한국어·영어 상세 시트와 한국어 독립 상세에서 재사용한다. 보이는 트리거는 `지도·길찾기` / `Maps & directions` 한 개이고, 펼친 선택 목록에 `NAVER Maps — Directions`와 `Google Maps — View location`을 표시한다.
- [ ] NAVER href는 기존 좌표 기반 경로를 유지한다. Google href는 공식 Maps URL `https://www.google.com/maps/search/?api=1&query=<encoded latitude,longitude>`로 구성한다. 새 API 키·SDK·서버 호출은 없다. 좌표가 없으면 두 링크를 숨기고 기존 위치 미확인 안내를 유지한다.
- [ ] 선택 목록은 상세 시트 안에서 펼친다. 중첩 모달을 사용하지 않고, 버튼의 열림 상태와 키보드 포커스를 표시한다. Escape는 펼친 지도 메뉴만 먼저 닫고 모바일 상세 시트까지 전달하지 않는다. 선택 또는 시장 변경 시 메뉴를 닫는다. 외부 링크는 새 탭으로 열고 시장 상세는 유지한다.

## Task 3 — 실제 흐름·회귀 검증

**Interfaces:** `apps/web/e2e/english-experience.spec.ts`는 로컬 `/en`, `/en/map`, `/`, `/sitemap.xml`을 검증한다. 외부 NAVER 링크는 목적지만 확인하고 실제 사이트로 이동하지 않는다.

- [ ] 영어 안내에서 지도 버튼을 누르고, 날짜 필터·시장 선택·상세·공유까지 영어 UI로 이용하는 브라우저 테스트를 작성한다. 공유된 URL 재진입, 새 탭의 목록 href, 모바일 뒤로/앞으로 가기가 `/en/map`과 필터·시장 상태를 유지하는지 확인한다.
- [ ] 지난 날짜·잘못된 날짜·존재하지 않는 시장 ID가 들어간 영어 공유 URL에서 조정 또는 선택 해제 안내가 보이는지 검증한다. 한국어 경로의 기존 동작은 회귀 테스트로 유지한다.
- [ ] 데이터 로딩·지도 오류·결과 없음·좌표 없음·일정 미확정 상태의 영어 안내를 확인한다. 한국어 고유명사는 허용하지만 조작 버튼·오류 안내가 한글로 남으면 실패다.
- [ ] 브라우저 시간대 Asia/Seoul, America/Los_Angeles, Europe/London에서 동일한 UTC 시각의 Today와 다음 장날이 같은 한국 날짜인지 확인한다. 자정·월말·연말, 열린 탭의 자정 통과와 백그라운드 복귀를 포함한다.
- [ ] 상세 시트와 한국어 독립 상세에서 지도 트리거가 하나만 보이는지 확인한다. NAVER는 기존 경로 URL, Google은 좌표 검색 URL로 열리고, 좌표 없는 시장에는 선택 목록이 나타나지 않아야 한다. Escape는 메뉴만 닫고 모바일 상세 시트를 유지해야 한다. 시장 변경·새 탭 이동 후 포커스와 열림 상태도 검증한다.
- [ ] 320·375·430px에서 메뉴·필터·시트·긴 영어 문구가 잘리거나 가로 스크롤되지 않는지 확인한다. 키보드와 화면 읽기 도구용 라벨도 점검한다.
- [ ] 최신 main의 모바일 preview/detail 전환, 접힌 시트·가상 키보드 표시·뒤로 가기를 영어 지도에서도 검증한다.
- [ ] 렌더링된 `/en`과 `/en/map`의 title·description·canonical·robots, `/en` 단일 sitemap 등록, 루트 한국어 canonical·Umami 유지 여부를 검증한다.
- [ ] 영어를 읽는 사용자에게 상설시장과 장날 설명을 보여 주고 ‘왜 장날에 방문하고 싶은가?’, ‘상설시장에도 장날이 있을 수 있나?’, ‘오늘 모든 점포가 열었나?’를 확인한다. 장날의 매력이나 운영 의미를 오해하면 문구를 수정한다.
- [ ] 관련 Vitest, `pnpm test`, `pnpm typecheck`, `pnpm build`를 먼저 실행한다. 최신 main의 Playwright 설정은 빌드된 standalone 서버를 시작하므로 빌드 성공 후 `pnpm --filter @jangnal-map/web exec playwright test e2e/english-experience.spec.ts`를 실행한다. 실패를 해결한 뒤 관련 검증만 다시 수행한다.
- [ ] Playwright가 3100 포트의 기존 서버를 재사용하도록 설정되어 있으므로, 테스트 전에 그 포트가 현재 빌드인지 확인한다. 불분명하면 기존 서버를 정리해 방금 빌드한 결과로 검증한다.
- [ ] README에 영어 경로, 한글 데이터·날짜 기준 한계, 공개 후 Search Console·Umami 확인 방법을 기록한다. 실제 색인·순위는 결과로 주장하지 않는다.

## 특히 검토할 위험

1. `MarketExplorer`의 현재 주소 갱신은 `/` 하드코딩이다. 영어 시장 선택·공유·뒤로 가기에서 `/en/map`이 유지되어야 한다.
2. 하위 컴포넌트의 숨은 `aria-label`, 오류·공유 피드백까지 영어로 바뀌어야 한다.
3. 영어 지도에서 한국어 독립 상세 링크로 이동할 때 사용자가 언어 변경을 미리 알아야 한다.
4. 공통 루트 `<html lang="ko">`는 이번 최소 범위에서 유지한다. 영어 콘텐츠의 `lang="en"` 지정은 꼭 확인한다. 문서 전체 언어를 바꾸려면 Next.js 라우트 그룹으로 루트 레이아웃을 나누는 별도 설계가 필요하다.
5. 미국·영국 접속자의 ‘Today’가 현지 날짜를 따르는 현재 코드를 한국 날짜로 교정해야 한다. 달력 컴포넌트와 일정 함수의 로컬 Date 계약을 혼동하면 월말·연말에 하루가 어긋날 수 있다.
6. Google Maps URL이 좌표를 열 수 있어도 한국 내 경로가 표시된다고 보장하지 않는다. CTA와 항목의 이름을 구분하고 실제 모바일에서 좌표 위치가 맞는지 확인한다.
7. 리뷰 당시 HEAD는 최신 `origin/main`보다 한 커밋 뒤다. 새 모바일 첫 화면의 컴포넌트와 상태 흐름을 반영하지 않고 구현하면 영어 UI의 일부가 누락된다.

## 결과물과 후속 판단

첫 출시 후 Search Console에서 `/en`의 영어 검색 노출·클릭을, Umami에서 `/en`과 `/en/map` 방문을 본다. Direct는 출처 미확인으로 분류한다. 방문자가 한글 시장명 때문에 막히면 다음 작업을 영문 시장명 검색으로 정하고, 시장 설명이 부족하면 검수된 시장의 영어 소개를 추가한다.

## ENGINEERING REVIEW — 2026-09-28

대상은 이 계획과 최신 `origin/main`의 현재 인터페이스다. 새 기능은 아직 구현되지 않았으므로 아래는 **기존 코드에서 확인한 위험과 구현 전에 필요한 검증**이다. 사용자가 확정한 C안, 단일 지도 앱 선택, 상설시장/장날 콘텐츠 범위를 유지한다. 새 제품 기능은 추가하지 않았다.

### 현재 구조와 구현 순서

```text
/en (정적 영어 안내)
  → /en/map (기존 MarketExplorer + locale=en)
     → URL 상태(q, when, date, market)
     → 시장 JSON + 17개 시·도 별칭 + KST 달력일
     → 목록 / NAVER 지도 / 모바일 미리보기·상세
     → 지도·길찾기 한 버튼 → NAVER 경로 | Google 좌표 위치
```

파일 구성은 기존 컴포넌트에 명시적인 locale prop을 전달하고, 작은 문구 사전·지역 매핑·날짜 변환·URL 구성 함수를 분리한다. 새 전역 상태나 번역 패키지는 필요하지 않다. 8개 이상의 파일을 건드리지만 기존 화면의 문구·접근성 라벨이 여러 파일에 흩어져 있어 기능을 온전히 영어화하려면 변경 대상이 실제로 많다. 작업은 최신 main 동기화 → 날짜·지역·URL 순수 함수 → 영어 UI → 지도 앱 메뉴 → 검증 순서로 진행한다. 공통 `MarketExplorer`와 문구 사전을 여러 작업이 동시에 바꾸므로 **순차 구현**이 안전하다.

### 1. 구조 검토

- **[P1, 신뢰도 10/10]** 최신 `origin/main`의 `MarketExplorer.tsx:213,262`는 각각 `window.history.replaceState(..., suffix ? \`/?...\` : "/")`, `window.history.pushState(..., \`/?...\`)`로 한국어 루트를 직접 쓴다. 기존의 `MarketList.tsx:38`도 `getMarketBrowsePath`를 href로 쓴다. 영어에서 일반 클릭을 막더라도 새 탭·공유가 한국어로 빠질 수 있다. `buildExplorerPath`를 주소 갱신·영어 목록 href·영어 공유에서 함께 쓰도록 계획을 강화했다.
- **[P1, 신뢰도 9/10]** 최신 main의 모바일 선택은 `MarketExplorer.tsx:255-265`에서 지도 선택을 preview로 열고 `mobileMarketView`, `mobileMarketSource`, `mobileReturnSnap`을 history에 기록한다. 구버전 HEAD에는 이 흐름이 없다. Task 0에서 최신 main을 기준으로 시작하고 두 언어 모두 미리보기·상세·뒤로/앞으로 가기를 검사한다.
- **[P2, 신뢰도 9/10]** 최신 모바일 상세 시트의 `MobileMarketSheet.tsx:82`는 Escape로 시트를 닫는다. 내부 지도 앱 메뉴가 같은 키를 처리하면 두 UI가 한 번에 닫힐 수 있다. 메뉴가 먼저 Escape를 처리하고 전파를 막도록 계획했다.
- `app/layout.tsx:39`의 `<html lang="ko">`는 영어 문서 전체 언어와 맞지 않는다. 이번 범위는 영어 콘텐츠 영역의 `lang="en"`을 사용한다. 루트 레이아웃 분리는 별도 국제화 작업으로 남긴다.

### 2. 코드 품질과 오류 경로

- **[P1, 신뢰도 10/10]** 최신 `MarketExplorer.tsx:186-187`은 `new Date()`를 최초 효과에서 한 번 읽고, `market-view.ts:6`과 `schedule.ts:12`는 기기 로컬 달력일을 사용한다. KST 변환은 기존 일정 함수에 전달할 달력일을 한 번만 만들고, 한국 자정/백그라운드 복귀에도 갱신해야 한다. `formatToParts`로 추출한 한국 연·월·일을 다시 시간대 변환하지 않는다.
- **[P2, 신뢰도 9/10]** `market-view.ts:100-104`의 검색은 한글 이름·주소 문자열을 직접 비교한다. 영문 시·도 별칭은 실제 주소 접두사 목록으로 해석하고 기존 한글 검색은 유지한다. 데이터에는 `전북특별차치도`가 포함되어 전북의 원본 표기를 테스트해야 한다.
- **[P2, 신뢰도 9/10]** `market-share-button.tsx:36-43`의 Web Share 제목·본문은 한글이며 기존 `getMarketBrowsePath`는 검수 시장을 한국어 독립 상세로 보낸다. 영어 화면은 영어 제목·본문과 현재 영어 필터 상태의 URL을 공유한다. 한국어 공유 계약은 유지한다.
- **[P2, 신뢰도 9/10]** `normalizeDirectDate`는 과거·잘못된 날짜를 오늘로 바꾸고, 현재 Explorer는 필터 밖의 시장 선택을 해제한다. 영어 공유 링크가 다른 날짜·선택 상태로 바뀔 때는 이유를 영어로 보여준다. 이는 이미 합의한 ‘같은 상태로 공유’의 실패 경로다.
- 외부 지도는 고정 호스트의 URL만 생성한다. 시장 좌표가 없으면 두 선택 항목을 숨긴다. Google 항목은 `View location`이고 한국 내 경로 제공을 약속하지 않는다. 사용자 검색어·시장명을 URL 호스트로 사용하지 않으며 쿼리 값은 URL 인코딩한다.

### 3. 테스트 검토

기존 Vitest는 한글 필터·상설시장 제외·URL 복원·일정 경계를 검사한다. 최신 main의 `market-explorer-mobile-preview.test.tsx`는 모바일 preview→detail, Back/Forward, 가상 키보드, 데이터 재시도를 검사한다. 새 영어 기능은 구현 전이므로 테스트도 아직 없다. 필요한 검증은 다음과 같다.

```text
순수 함수 [UNIT]
  17개 시·도 별칭/전북 원본값/미매칭 → 한글 검색 유지
  동일 UTC 시각의 KST 달력일 → LA·London·Seoul 동일 결과
  자정·월말·윤년·백그라운드 복귀 → Today 갱신
  locale + q/when/date/market → 영어 URL 직렬화·재진입
  시장 좌표 → NAVER 경로 / Google 위치 URL; 좌표 없음 → 메뉴 없음

사용자 흐름 [E2E]
  영어 안내 → 지역 입력 → 장날 선택 → 모바일 preview/detail → 앱 선택
  새 탭 목록 링크/공유 링크 → 영어 URL·필터·시장 보존
  Back/Forward, Escape(메뉴만 닫기), 지도 SDK 실패 → 영어 안내·목록
  한국어 기본 화면·검수 시장 독립 상세 → 기존 동작 유지
```

- **[P1, 신뢰도 10/10]** 최신 `playwright.config.ts`의 `webServer.command`는 `.next/standalone/.../server.js`를 시작하지만 기존 계획은 Playwright를 빌드보다 먼저 실행하도록 적었다. `pnpm build` 뒤 Playwright를 돌리도록 순서를 수정했다. `reuseExistingServer: true`인 3100 포트가 이전 빌드인지도 확인한다.
- 날짜·별칭·URL 생성은 단위 테스트로, 여러 컴포넌트를 거치는 영어 방문 흐름과 실제 DOM 언어·메타데이터는 브라우저 테스트로 검증한다. 외부 Google/NAVER 서버 상태는 자동 테스트하지 않고 링크 형식과 모바일 실제 위치 표시를 수동 확인한다.

### 4. 성능 검토

새 시·도 별칭 표는 17개이고 기존 클라이언트 필터는 1,393개 시장을 순회한다. 별칭 검사 비용은 지도 SDK·마커 처리보다 작을 것으로 예상되지만 실제 수치는 측정 전까지 주장하지 않는다. `/en`은 정적 안내여서 시장 JSON·지도 SDK를 로드하지 않는다. `/en/map`은 기존 QueryClient·JSON fetch를 재사용한다. 새 서버 API·DB 쿼리·비밀키는 없다. 모바일 320px과 느린 네트워크에서 목록 fallback과 필터 반응을 확인한다.

### 실패 모드와 관측 한계

| 경로 | 실패 | 복구/보이는 결과 | 계획된 검증 |
| --- | --- | --- | --- |
| 시장 JSON | HTTP·구문·배열 형식 오류 | 영어 오류와 재시도 | 브라우저 |
| NAVER SDK | 로딩·시간 초과 | 영어 목록 대체 | 브라우저 |
| 지역 별칭 | 오타·미지원 시군구 | 영어 빈 결과와 입력 범위 안내 | 단위·브라우저 |
| 날짜 | 해외 시차·한국 자정 | KST 기준 재계산 | 시간대 단위·브라우저 |
| 공유 URL | 과거 날짜·없는 시장 ID | 조정/선택 해제 안내 | 브라우저 |
| 지도 앱 | 좌표 없음·Google 경로 미지원 | 메뉴 숨김/Google은 위치 보기로 표기 | 단위·실기기 |
| 모바일 메뉴 | Escape 전파·시장 교체 | 메뉴만 닫기·포커스 복귀 | 브라우저 |

새 코드의 핵심 경로에 ‘오류 처리 없음·검증 없음·사용자에게 침묵’인 조합을 남기지 않도록 계획했다. Umami는 페이지 방문을 보여 주지만 현재 계획에 앱 선택 이벤트는 없어 NAVER/Google 사용 비율은 알 수 없다. 이를 방문 수요로 과장하지 않는다.

### 기존 자산과 범위 밖

재사용: `filterMarkets`, `getMarketDates`, `getNextMarketDate`, 기존 한국어 지도/목록 fallback, Web Share, Umami, sitemap. 범위 밖: 1,393개 영문 시장명, 영어 독립 시장 상세, 지도 SDK 교체, Google 경로 보장, 별도 번역 패키지. 새 구조는 이 자산 위에 얇게 추가한다.

### 구현 작업

- [ ] **E1 (P1, 사람 약 2시간 / AI 약 20분)** 최신 main으로 구현 작업 트리를 맞추고 모바일 preview/detail 테스트를 기준으로 번역 대상을 확인한다. 근거: 구조 검토, 최신 main 모바일 변경. 파일: `MarketExplorer`, `MobileHomeControls`, `MarketPreview`, `MobileMarketSheet`. 검증: 최신 main 관련 Vitest.
- [ ] **E2 (P1, 사람 약 1일 / AI 약 1시간)** KST 기준일·자정 갱신과 17개 영문 시·도 검색을 구현한다. 근거: 코드 품질 검토, 기기 날짜/한글 전용 검색. 파일: `korea-date.ts`, `region-aliases.ts`, `market-view.ts`. 검증: 고정 UTC 시각과 전북 원본값 단위 테스트.
- [ ] **E3 (P1, 사람 약 1일 / AI 약 1시간)** locale별 URL 직렬화를 주소 갱신·영어 목록 href·영어 공유에 적용한다. 근거: 구조·코드 품질 검토, 현재 `/` 하드코딩. 파일: `locale.ts`, `MarketExplorer`, `MarketList`, `MarketShareButton`. 검증: 새 탭/공유/Back/Forward 브라우저 테스트.
- [ ] **E4 (P2, 사람 약 반나절 / AI 약 45분)** 단일 지도 앱 메뉴의 Escape·좌표 없음·외부 링크 동작을 완성한다. 근거: 구조 검토, 모바일 시트 Escape와의 충돌. 파일: `market-directions-menu.tsx`, `MarketDetail`, 한국어 시장 상세. 검증: 메뉴·키보드·실기기 링크.
- [ ] **E5 (P1, 사람 약 반나절 / AI 약 30분)** 빌드 후 Playwright를 실행하고 3100 포트가 현재 빌드인지 확인한다. 근거: 테스트 검토, standalone 서버 설정. 파일: 구현 계획·브라우저 테스트. 검증: `pnpm test`, `pnpm typecheck`, `pnpm build`, 관련 Playwright.

### 검토 상태

- 설계 범위: 사용자가 선택한 C안과 단일 지도 앱 선택을 유지.
- 구조·코드 품질·테스트: 8개 근거 있는 위험을 계획의 작업·검증에 반영.
- 테스트: 최신 모바일 회귀를 포함한 단위·브라우저 경계 작성, 아직 실행 전.
- 성능: 새 서버 병목 없음, 실제 수치는 구현 뒤 확인.
- 외부 검토: Codex 호스트 안에서 Codex CLI를 중첩 실행하지 않는다. 현재 호스트에 별도 Claude Plan/TaskOutput/TaskStop 인터페이스가 없어 이번 회차의 독립 검토는 미실시.
- 남은 구현 전 조건: 최신 main 기준 재대조. 미해결 제품 범위 결정은 없음.

## 로컬 구현 현황

- 구현 브랜치: `codex/english-traveler-map`, 기준 `39b27f7` (당시 최신 main).
- `/en`의 영어 안내·검색 메타데이터·sitemap, `/en/map`의 영어 UI·17개 시·도 검색·한국 날짜, 영어 공유 URL과 단일 지도 앱 메뉴를 구현했다. 상설시장과 장날의 차이·장날의 방문 이유도 영어 본문에 반영했다.
- 테스트에서 직접 선택한 여행 날짜와 ‘다음 장날’을 구분하고, 한국 자정 통과·백그라운드 복귀, 지난 날짜·시장 미존재 링크, 모바일 메뉴 Escape·뒤로 가기를 확인했다.
- 기존 `main`에서 모바일 fallback 기대값과 Playwright의 `public` 파일 복사가 맞지 않아 실패하던 회귀 테스트를 현재 모바일 설계에 맞춰 정리했다. 기준 main의 375px 검증에서도 두 실패를 재현했다.
- 독립 코드 리뷰에서 선택 날짜의 입력·공유 문구·미리보기 높이·URL 뒤로/앞으로 가기·지도 메뉴 포커스 문제를 찾았고, 각각 실패하는 테스트로 재현해 수정했다.
- 최종 자동 검증: `pnpm test`, `pnpm typecheck`, `pnpm build`, 전체 Playwright 132개가 성공했다.
- 남은 수동 확인: 실제 iOS·Android에서 NAVER 경로와 Google 좌표 위치, NAVER 지도의 핀·저작권 표시를 확인해야 한다. 영어 사용자 3명에게 지역·날짜·시장·지도 선택 과제를 설명 없이 시켜 보는 관찰도 남아 있다. 검색 색인·순위는 배포 후에만 확인할 수 있다.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | --- | --- | --- |
| CEO Review | `/plan-ceo-review` | 외국인 대상 범위·사용자 과업 | 1 | CLEAR | C안 확정, 단일 지도 앱 선택, 최신 main 대비·날짜·필터 의미 검토 |
| Codex Review | `/codex review` | 독립적인 두 번째 관점 | 0 | UNAVAILABLE | Codex 호스트의 중첩 실행을 피했고 별도 Plan 리뷰 도구 없음 |
| Eng Review | `/plan-eng-review` | 구조·테스트 | 1 | CLEAR | URL 상태·KST 갱신·모바일 메뉴·테스트 순서 등 8개 위험 반영 |
| Design Review | `/plan-design-review` | UI·사용성 | 0 | — | 실행하지 않음 |
| DX Review | `/plan-devex-review` | 개발자 경험 | 0 | 해당 없음 | 일반 방문자용 기능 |

상세 근거와 11개 검토 항목: `docs/superpowers/reviews/2026-09-28-english-traveler-ceo-review.md`.

사용자 후속 보완: 상설시장과 장날의 차이·겹침, 장날에 판매 물품과 볼거리가 더 풍성해질 수 있다는 방문 동기, 점포별 영업 불확실성을 영어 안내와 검증 항목에 추가했다. CEO 리뷰의 범위 내 콘텐츠 명확화이며 구현 상태는 바뀌지 않았다.

**VERDICT:** CEO + Eng 계획 검토 완료. 구현은 최신 main을 기준으로 시작하고 테스트는 해당 빌드로 수행한다. 영어 사용자 화면을 만든 뒤 사용성 검증이 남는다.

NO UNRESOLVED DECISIONS
