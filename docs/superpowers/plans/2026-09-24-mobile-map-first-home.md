# Mobile Map First Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mobile home map useful on short screens and keep the selected pin visible while the user checks the next market date.

**Architecture:** Keep the current `MarketExplorer` data, URL, and desktop flow. On mobile, place a compact search/menu/filter toolbar over the map, move secondary content into the result sheet or menu, and add a nonmodal market preview for map pin taps. Measure the top toolbar and bottom sheet, then use those measurements to position selected pins and map controls inside the unobscured area.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, NAVER Maps JavaScript API v3, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-24-mobile-map-first-home-design.md` (supersedes only the home decisions in the 2026-09-21 mobile UX spec).

## Global Constraints

- Scope is the home at widths `<=700px`; desktop and subpage app bars keep their current structure.
- Preserve `q`, `when`, `date`, and `market` URL behavior, market data, schedule calculations, canonical market pages, and the 10-second representative task.
- Primary controls have at least 44×44px hit areas; search text is at least 16px. Honor safe areas, 200% text zoom, keyboard use, and reduced motion.
- If the map key or SDK is missing, show a usable full result list. If a selected market lacks coordinates, show its detail without a map preview or directions.
- The NAVER logo and map attribution must remain visible while the map is interactive (results collapsed/half or market preview). Test this with a valid NAVER key; a fallback-only browser run does not satisfy the map gate.
- Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm --filter @jangnal-map/web exec playwright test` before completion.

## File Map

| File | Responsibility |
| --- | --- |
| `apps/web/src/components/mobile-home-controls.tsx` | Own the home-only menu trigger and install menu state; render the existing filters in one mobile floating toolbar. |
| `apps/web/src/components/market-filters.tsx` | Add a small brand mark and an injected menu control beside search without changing desktop filter behavior. |
| `apps/web/src/components/market-preview.tsx` | Render the pin selection summary and the explicit `상세 보기` action. |
| `apps/web/src/components/mobile-market-sheet.tsx` | Render result, preview, and full-detail presentations with distinct semantics and controls. |
| `apps/web/src/components/market-explorer.tsx` | Coordinate selection source, browser history, focus, sheet state, content placement, and measured map occlusion. |
| `apps/web/src/components/market-map.tsx`, `apps/web/src/lib/naver-maps.ts` | Apply measured viewport padding and keep selected coordinates inside the visible map area. |
| `apps/web/src/components/mobile-menu.tsx` | Keep every former footer destination reachable on mobile. |
| `apps/web/src/app/globals.css`, `apps/web/src/components/site-footer.module.css` | Mobile-only layering, compact sheet sizes, keyboard and safe-area layout. |
| `apps/web/e2e/support/fake-naver.ts` | Provide a deterministic map-ready SDK stub for layout tests without a production key. |
| Existing `*.test.tsx` and `apps/web/e2e/*.spec.ts` | Pin state/history, map API calls, short-screen geometry, menu links, and fallback coverage. |

## Review Focus

1. A map pin opens a preview, but a list item and direct `?market=` URL open full detail; Task 2 tests all three sources.
2. Browser Back/Forward and preview-to-detail do not create duplicate market history entries or lose the prior result snap; Task 2 tests these transitions.
3. Real map padding and camera movement do not cover the selected marker, NAVER logo, or attribution; Task 3 tests calls with a fake map and requires a real-key visual check.
4. A short viewport or open keyboard does not hide search, close, detail, or result actions; Tasks 1 and 4 test 320×568 and 375×667 plus manual Safari/Chrome keyboard behavior.
5. Missing SDK, empty results, and coordinate-less markets still have a usable list/detail path; Tasks 2 and 4 test each path.

---

### Task 1: Give the home its map area

**Files:**
- Create: `apps/web/src/components/mobile-home-controls.tsx`
- Modify: `apps/web/src/components/market-filters.tsx`
- Modify: `apps/web/src/components/mobile-menu.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/mobile-market-sheet.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/site-footer.module.css`
- Modify: `apps/web/src/components/market-filters.test.tsx`
- Modify: `apps/web/src/components/mobile-app-bar.test.tsx`
- Modify: `apps/web/e2e/mobile-map-space.spec.ts`
- Create: `apps/web/e2e/support/fake-naver.ts`

**Interfaces:** Export the existing `MarketFiltersProps` type. `MobileHomeControls` receives those values and forwards the filter callbacks unchanged. `MarketFilters` accepts `mobileMenuControl?: ReactNode`, `onSearchFocus?: () => void`, and `onSearchBlur?: () => void`; the menu control appears only in its mobile search row.

- [ ] **Step 1: Add failing home-toolbar and link tests.** In `market-filters.test.tsx`, render `MarketFilters` with `mobileMenuControl={<button aria-label="메뉴 열기" />}` and assert search, all five date buttons, and the menu control are present. In `mobile-app-bar.test.tsx`, open `MobileMenu` and assert a link to `/about#data-policy` exists along with privacy, terms, about, and report destinations. Run `pnpm --filter @jangnal-map/web test -- src/components/market-filters.test.tsx src/components/mobile-app-bar.test.tsx`; expect the new assertions to fail.

- [ ] **Step 2: Build the home-only toolbar.** Move the home `MobileAppBar` use in `MarketExplorer` to `MobileHomeControls`; retain `MobileAppBar` on subpages. `MobileHomeControls` uses `useInstallPrompt`, renders one menu trigger and `MobileMenu`, and passes that trigger into `MarketFilters`. Give the mobile filter markup a brand mark and accessible `오늘 장날` name. The first row contains brand, search and menu; the second row contains the existing date choices. Keep the wrapper layout-neutral on desktop with `display: contents`, then position it over the map only below 701px. Extract the current inline direct-date callback as `handleDirectDateChange` without changing its normalization. Use the same menu focus restoration already implemented in `MobileMenu`. Add the missing data-policy link in `MobileMenu`.

```tsx
<MobileHomeControls
  mode={mode}
  query={query}
  directDate={directDate}
  minDate={toIsoDate(today)}
  onModeChange={setMode}
  onQueryChange={setQuery}
  onDirectDateChange={handleDirectDateChange}
/>
```

- [ ] **Step 3: Move non-map content out of fixed height.** Keep `ReviewedMarketGuides` above the grid for desktop and render its mobile instance inside the results sheet. Wrap `SiteFooter` in a home-only container hidden below 701px. The mobile menu already carries every former footer link after Step 2. Set the mobile explorer grid to fill the home viewport behind the absolute toolbar and sheet; keep the DOM search order before the map for keyboard users.

- [ ] **Step 4: Define actual compact sizes.** Give the floating toolbar safe-area top padding and a solid readable surface. Make the result sheet's collapsed presentation `64px` high with one full-width button for `N곳 시장 결과 · 목록 열기`; hide the separate 44px handle only in this state. Keep explicit buttons and a 44px handle for half/full states. Use `max-height` and scrolling rather than fixed content height at 200% text zoom.

- [ ] **Step 5: Pin geometry in Playwright.** Create `e2e/support/fake-naver.ts` with `installFakeNaver(page)` that calls `page.addInitScript` before navigation and installs minimal `Map`, `Marker`, `LatLng`, `Point`, and `Event` implementations used by `MarketMap`. Build an isolated local test bundle with `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=e2e-fixture pnpm build`; the stub makes `loadNaverMaps` resolve without network access. In `mobile-map-space.spec.ts`, measure the bottom of `.mobile-home-controls` and top of `.mobile-market-sheet` at 320×568 and 375×667. The clear span at 375×667 must be at least `0.6 * window.innerHeight`; at 320×568 assert both controls remain in viewport and no horizontal overflow occurs. Run the focused spec against this bundle. Then run the keyless fallback test against a normal keyless build; expect the full result list rather than a fabricated ready map.

```ts
import type { Page } from "@playwright/test";

export async function installFakeNaver(page: Page) {
  await page.addInitScript(() => {
    class LatLng {
      constructor(public latitude: number, public longitude: number) {}
    }
    class Point {
      constructor(public x: number, public y: number) {}
    }
    class Map {
      getZoom() { return 11; }
      getBounds() {
        return {
          getNE: () => ({ lat: () => 39, lng: () => 131 }),
          getSW: () => ({ lat: () => 33, lng: () => 124 }),
        };
      }
      setOptions() {}
      panTo() {}
      panBy() {}
      setZoom() {}
    }
    class Marker { setMap() {} }
    Object.assign(window, {
      naver: { maps: { Map, Marker, LatLng, Point,
        Event: { addListener: () => ({}), removeListener: () => undefined } } },
    });
  });
}
```

- [ ] **Step 6: Verify and commit.** Run the focused Vitest files, `pnpm typecheck`, and the focused Playwright spec with the deterministic map fixture. Stage only Task 1 files and commit `feat: give mobile home more map space`.

### Task 2: Add a pin preview without breaking history

**Files:**
- Create: `apps/web/src/components/market-preview.tsx`
- Create: `apps/web/src/components/market-preview.test.tsx`
- Modify: `apps/web/src/components/mobile-market-sheet.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/mobile-market-sheet.test.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`
- Modify: `apps/web/e2e/mobile-navigation.spec.ts`
- Modify: `apps/web/e2e/mobile-sheet-detail-flow.regression-002.spec.ts`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:** Keep `SheetSnap = "collapsed" | "half" | "full"` for results. Extend `SheetMode` to `"results" | "preview" | "detail"`. `MarketPreview` receives `{ market: PublicMarket; today: Date; onOpenDetail: () => void }`; the sheet heading owns the close action. `selectMarket(market, source: "map" | "list")` is the only selection entry point; the map and list pass their source explicitly.

- [ ] **Step 1: Write failing selection tests.** Extend `market-explorer.test.tsx` with a fake ready map whose `Event.addListener` stores marker callbacks; invoke a market marker callback to simulate a map-origin selection. Assert it renders a `region` labeled `${market.name} 미리보기`, with `상세 보기` and the formatted next date. Assert a list-origin selection renders the existing full `dialog`, and a direct URL `?market=tongbok` also renders the full dialog. Verify coordinate-less list markets have no directions action. Run `pnpm --filter @jangnal-map/web test -- src/components/market-explorer.test.tsx src/components/market-preview.test.tsx`; expect failures before implementation.

- [ ] **Step 2: Render the summary from existing date helpers.** In `MarketPreview`, reuse `getNextMarketDate`, `getDday` and `formatKoreanDate` from the existing market view/schedule code. Render `매일 운영` for daily markets and `운영 일정 확인 필요` for unknown schedules. Use one-line truncation for a long address, but keep the full address as accessible text. Do not duplicate the full `MarketDetail` or invent a second date calculation.

```tsx
<MarketPreview
  market={selectedMarket}
  today={today}
  onOpenDetail={() => setSheetMode("detail")}
  onClose={closeMarket}
/>
```

- [ ] **Step 3: Add preview presentation and controls.** `MobileMarketSheet` renders preview at `clamp(150px, 24dvh, 180px)` and gives it `role="region"`, while full detail remains `role="dialog" aria-modal="true"` and inerts the background. Preview has visible `상세 보기` and `닫기` buttons. Its 44px heading is the gesture target for an upward drag to full detail; it also has a visible button path, so swiping is optional. The results snap controls never transition into preview accidentally.

- [ ] **Step 4: Preserve URL, Back and focus.** Map selection stores `{mobileMarket:id, mobileMarketView:"preview"}` in `history.pushState`; list selection stores `mobileMarketView:"detail"`. Preview-to-detail replaces that entry's view, so Back returns to the prior result state. A direct `?market=` load with no matching history state opens full detail. On `popstate`, choose the view from state only when its market ID matches the URL; otherwise open full detail. Closing returns to the remembered results snap and scroll. Add an escaped `data-market-id` to map marker buttons and restore focus to the originating list item or selected `.map-marker[data-market-id]`; if the map marker was rerendered, focus the result bar. When filters remove the selected market, clear `market` and the transient view field without adding a history entry.

- [ ] **Step 5: Update regression scenarios.** Keep the existing list-item-to-full-detail tests. Add Playwright assertions for preview `상세 보기`, closing, browser Back/Forward, and URL reload. Update the older test that assumes *every* selection opens full height so it explicitly selects from the list. Test Escape closes a full detail through `onClose` so the URL and focus change with the sheet. Run focused Vitest and the two mobile Playwright specs.

- [ ] **Step 6: Commit.** Stage only Task 2 files and commit `feat: preview map markets before full detail`.

### Task 3: Keep pins and map controls in the visible region

**Files:**
- Modify: `apps/web/src/lib/naver-maps.ts`
- Modify: `apps/web/src/components/market-map.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/market-map.regression-001.test.tsx`
- Modify: `apps/web/src/components/market-map.test.tsx`

**Interfaces:** Add `mobileOcclusion?: { top: number; bottom: number } | null` on `MarketMap`. `undefined` keeps the desktop behavior, an object means the map is interactive and its overlays are measured, and `null` pauses camera/padding changes under modal/full-list sheets. Retain the old optional `mobileSheetHeight` path for existing callers until their test fixtures migrate. Add `setOptions({ padding: { top: number; right: number; bottom: number; left: number } })` and `getProjection().fromCoordToOffset(coord)` to the local NAVER map type. The parent computes occlusion from the rendered toolbar/sheet rectangles through `ResizeObserver` and `visualViewport` resize events.

- [ ] **Step 1: Add failing geometry tests.** Extend the fake map in `market-map.regression-001.test.tsx` with spies for `setOptions`, `panTo`, `panBy`, and `getProjection`. Make its fake projection update the marker offset when `panBy` runs. For `{top:108,bottom:170}`, assert map padding uses those measured values plus a 12px inner margin. After selecting a marker, assert its projected offset lands within the target rectangle (12px inside the unobscured viewport). Assert a sheet-height-only change does not reset zoom, and no recenter occurs with no selection. Run `pnpm --filter @jangnal-map/web test -- src/components/market-map.regression-001.test.tsx`; expect failures until the new occlusion interface is added.

- [ ] **Step 2: Measure overlaps once in the parent.** Attach refs to `.mobile-home-controls`, `.map-stage` and the sheet. In `MarketExplorer`, calculate `top = max(0, toolbar.bottom - map.top)` and `bottom = max(0, map.bottom - sheet.top)` in CSS pixels. Update only when rounded values change to avoid a ResizeObserver render loop. In modal detail-full, keep the map mounted but pause padding/camera updates until the user returns to an interactive map state; this avoids impossible padding on short screens. On desktop, pass `undefined`.

```ts
type MapOcclusion = { top: number; bottom: number };
const top = Math.max(0, Math.round(toolbarRect.bottom - mapRect.top));
const bottom = Math.max(0, Math.round(mapRect.bottom - sheetRect.top));
```

- [ ] **Step 3: Use NAVER's documented padding and projection.** Apply pixel padding with `map.setOptions` when occlusion changes so built-in controls, logo, and attribution use the available region. On a newly selected market, `panTo` its coordinate, then use `getProjection().fromCoordToOffset` and `panBy` only if the marker is outside the rectangle between top and bottom padding; target the center of that rectangle. Recheck after the map's `idle` event rather than assuming the first projection is final. Keep direct user pans intact when only React rerenders.

- [ ] **Step 4: Align the current-location control.** Position `.location-control` above the measured sheet top and below the floating toolbar, with safe-area spacing. Hide it while full detail is modal; keep its button at 44×44px. Verify location success and denial tests still pass.

- [ ] **Step 5: Verify real SDK behavior.** Run the focused map Vitest files and `pnpm typecheck`. With a valid `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`, open the local production build at 375×667 and 320×568, select pins near each edge, drag the sheet and rotate the device. In results collapsed/half and preview states, confirm the selected pin, NAVER logo, and attribution remain visible. Record screenshots and observations in `docs/verification/mobile-map-first-2026-09-24.md`. If a valid key/device is unavailable, leave this acceptance gate explicitly unverified; do not report the map behavior as passed.

- [ ] **Step 6: Commit.** Stage only Task 3 files and the verification note; commit `fix: keep selected market visible above mobile sheet`.

### Task 4: Keyboard, fallback, and release verification

**Files:**
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/mobile-market-sheet.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/e2e/mobile-map-space.spec.ts`
- Modify: `apps/web/e2e/mobile-navigation.spec.ts`
- Modify: `apps/web/e2e/mobile-overflow.spec.ts`
- Modify: `docs/verification/mobile-map-first-2026-09-24.md`
- Modify: `README.md`

**Interfaces:** No public API changes. Search keeps the existing URL query; keyboard focus changes only transient sheet presentation. README's mobile exploration description must match the final home layout.

- [ ] **Step 1: Add failing short-screen and fallback checks.** At 320×568, 375×667, 375×844 and 430×844, assert the search field, active filter, menu button and result/list action remain in viewport, and `document.documentElement.scrollWidth <= innerWidth`. In the keyless build, assert the full list and retry/empty actions remain usable. Add a coordinate-less market scenario from the list. Run the focused Playwright files; expect the new assertions to expose any overlap.

- [ ] **Step 2: Handle keyboard and small height.** While search is focused and the visual viewport shrinks, expand results to a scrollable list instead of leaving a narrow map strip under the keyboard. Restore the prior result snap on blur only when the user has not opened a market. Keep the input, clear action, list, and preview/detail buttons above the visual viewport bottom. At 200% text zoom, let the toolbar grow and update map occlusion rather than clipping text.

- [ ] **Step 3: Check accessibility transitions.** Test Tab navigation through search, filters, results bar, preview, and full-detail dialog; Escape closes preview or detail and updates the URL; focus returns to a usable origin. Test `prefers-reduced-motion: reduce` with the existing CSS rule. Check drag and explicit-button paths on iPhone Safari and Android Chrome.

- [ ] **Step 4: Run final verification once.** Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm --filter @jangnal-map/web exec playwright test`. Record command results, keyless fallback results, real-SDK findings, viewport measurements, and remaining device limitations in `docs/verification/mobile-map-first-2026-09-24.md`. Update the README mobile paragraph to describe the floating controls and pin preview.

- [ ] **Step 5: Commit and review.** Stage only Task 4 files and commit `test: verify mobile map-first exploration`. Review the complete branch diff against the spec. A release requires the real NAVER SDK and device checks in Task 3 as well as the automated checks above.

## Execution Order

Tasks 1 and 2 establish the layout and selection states; Task 3 depends on both measured overlays and preview height; Task 4 validates the combined behavior. Each task is reviewable as a separate commit. Do not widen this plan to the other mobile routes or change market data.
