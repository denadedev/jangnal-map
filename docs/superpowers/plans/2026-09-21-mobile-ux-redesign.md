# Mobile UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild every public mobile screen around a map-plus-snap-sheet market flow while preserving market data, URL state, and existing desktop behavior.

**Architecture:** Add shared mobile chrome (`MobileAppBar` and `MobileMenu`) and a controlled `MobileMarketSheet` with collapsed, half, and full snap states. Keep market filtering and URL synchronization in `MarketExplorer`, move presentation-only mobile layout into focused components/styles, and cover behavior with Vitest plus Playwright mobile flows.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules/global CSS, TanStack Query, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-21-mobile-ux-redesign-design.md`

## Global Constraints

- Primary mobile widths are 360–430px; 320px must have no horizontal overflow or clipped content.
- The representative task `평택 검색 → 시장 선택 → 다음 장날 확인` must complete within 10 seconds.
- Preserve the existing `q`, `when`, `date`, and `market` URL query state and existing market/date calculation behavior.
- Major touch targets are at least 44×44px; editable mobile fields use at least 16px text.
- iPhone Safari and Android Chrome are the manual device targets.
- Map failure, missing map keys, data failure, empty results, denied location, and report submission failure remain usable and actionable.
- Keep the existing visual language, data copy, SEO routes, and desktop layout unless a shared mobile rule is explicitly scoped below 700px.

## Review Focus

- A selected market must remain recoverable after a filter excludes it; Task 2 pins the reset-to-results behavior in `market-explorer.test.tsx`.
- Missing map SDK/key must still expose search, filters, and the full market list; Task 2 adds the mobile fallback test.
- A denied location permission must move the user toward region search instead of leaving a dead control; Task 2 adds the location-denied test.
- A long report form must focus the first invalid field without losing entered values; Task 4 adds the validation-focus test.
- Menu/sheet focus and browser back behavior must not trap or lose keyboard users; Tasks 1–3 add focus and escape/back tests.

---

### Task 1: Shared mobile app chrome and installation entry point

**Files:**
- Create: `apps/web/src/components/mobile-app-bar.tsx`
- Create: `apps/web/src/components/mobile-menu.tsx`
- Create: `apps/web/src/components/mobile-app-bar.test.tsx`
- Modify: `apps/web/src/components/install-prompt.tsx`
- Modify: `apps/web/src/components/install-prompt.test.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/app/onnuri/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/report/page.tsx`
- Modify: `apps/web/src/app/privacy/page.tsx`

**Interfaces:**
- `MobileAppBarProps = { title?: string; backHref?: string; homeHref?: string; onMenuOpen?: () => void }`.
- `MobileAppBar` renders a home brand when `backHref` is absent and a labeled back link when it is present; the menu button is always a native button on mobile and is hidden from desktop layout.
- `MobileMenuProps = { open: boolean; onClose: () => void; installAction?: (() => void | Promise<void>) | null; iosGuide?: boolean }`.
- `MobileMenu` renders links to `/onnuri`, `/report?kind=service`, and `/privacy`, plus a conditional install action; it traps focus while open and returns focus to the trigger on close.
- `useInstallPrompt(): { platform: "android" | "ios" | null; install: () => Promise<void>; showIosGuide: () => void; dismiss: () => void }` keeps the existing `beforeinstallprompt` and iOS detection while exposing install state to `MobileMenu`; the old layout-pushing `InstallPrompt` render is removed.

- [ ] **Step 1: Write failing tests for shared chrome**

```tsx
it("opens the mobile menu and returns focus to its trigger", async () => {
  const user = userEvent.setup();
  render(<MobileAppBar title="오늘 장날" />);
  await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
  expect(screen.getByRole("dialog", { name: "보조 메뉴" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));
  expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveFocus();
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm --filter @jangnal-map/web test -- src/components/mobile-app-bar.test.tsx`

Expected: FAIL because `MobileAppBar` and `MobileMenu` do not exist.

- [ ] **Step 3: Implement the shared mobile chrome**

Create `MobileAppBar` with a visible 44px menu trigger, optional back link, and `aria-expanded`/`aria-controls`. Create `MobileMenu` as a modal dialog with a backdrop, focus return, Escape close, and the three existing auxiliary links. Keep the component mounted only when open so the desktop header remains unchanged.

Add a mobile-only `.mobile-app-bar`, `.mobile-menu-backdrop`, `.mobile-menu-dialog`, and `.mobile-menu-link` rule set in `globals.css`. Use `env(safe-area-inset-top)` and `min-height: 44px`; do not introduce a persistent bottom navigation.

- [ ] **Step 4: Move installation from banner to menu**

Refactor `InstallPrompt` into the `useInstallPrompt` hook described above, preserving the 14-day dismissal key, Android `beforeinstallprompt`, and iOS guide behavior. In `MarketExplorer`, call the hook, render `MobileAppBar` and `MobileMenu`, and pass the conditional install action. Remove the mobile `.install-prompt` display rules only after the new menu action is covered by tests.

- [ ] **Step 5: Adopt the shared chrome on all public routes**

Use the shared app bar in the home, market detail, Onnuri, report, and privacy routes. Preserve desktop navigation markup through the existing desktop header rules or a desktop-only wrapper. For subpages pass `backHref` to the previous context and a concise title (`시장 정보`, `온누리상품권`, `제보하기`, `개인정보 안내`).

- [ ] **Step 6: Run focused tests and typecheck**

Run: `pnpm --filter @jangnal-map/web test -- src/components/mobile-app-bar.test.tsx src/components/install-prompt.test.tsx`

Expected: PASS. Then run `pnpm typecheck` and expect PASS.

- [ ] **Step 7: Commit the shared chrome**

```bash
git add apps/web/src/components/mobile-app-bar.tsx apps/web/src/components/mobile-menu.tsx apps/web/src/components/mobile-app-bar.test.tsx apps/web/src/components/install-prompt.tsx apps/web/src/components/install-prompt.test.tsx apps/web/src/app/globals.css apps/web/src/components/market-explorer.tsx apps/web/src/app/onnuri/page.tsx 'apps/web/src/app/markets/[slug]/page.tsx' apps/web/src/app/report/page.tsx apps/web/src/app/privacy/page.tsx
git commit -m "feat: add shared mobile app chrome"
```

### Task 2: Map-plus-snap-sheet home explorer

**Files:**
- Create: `apps/web/src/components/mobile-market-sheet.tsx`
- Create: `apps/web/src/components/mobile-market-sheet.test.tsx`
- Modify: `apps/web/src/components/market-explorer.tsx`
- Modify: `apps/web/src/components/market-filters.tsx`
- Modify: `apps/web/src/components/market-map.tsx`
- Modify: `apps/web/src/components/market-detail.tsx`
- Modify: `apps/web/src/components/market-explorer.test.tsx`
- Modify: `apps/web/src/components/market-filters.test.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- `type SheetSnap = "collapsed" | "half" | "full"`.
- `MobileMarketSheetProps = { snap: SheetSnap; onSnapChange: (snap: SheetSnap) => void; mode: "results" | "detail"; onModeChange: (mode: "results" | "detail") => void; children: ReactNode; title: string; describedBy?: string }`.
- `MobileMarketSheet` provides `data-snap`, a keyboard-accessible handle, explicit expand/collapse buttons, and pointer drag snapping to the nearest state; it must not require a drag gesture.
- `MarketExplorerContent` owns `sheetSnap` and `sheetMode`; `selectedId` remains the sole source of truth for the selected market.
- `MarketMapProps` gains `onStatusChange?: (status: "idle" | "loading" | "ready" | "error") => void` and `onLocationError?: (message: string, permissionDenied: boolean) => void`; existing callbacks remain unchanged.
- The sheet test defines `const onSnapChange = vi.fn()` and renders a minimal `children` node; the market detail test defines `marketFixture` from the existing `PublicMarket` shape used by `market-explorer.test.tsx`.

- [ ] **Step 1: Write failing sheet-state tests**

```tsx
it("moves between snap states with buttons and keyboard", async () => {
  const user = userEvent.setup();
  render(<MobileMarketSheet snap="collapsed" onSnapChange={onSnapChange} mode="results" onModeChange={vi.fn()} title="시장 결과" />);
  await user.click(screen.getByRole("button", { name: "결과 펼치기" }));
  expect(onSnapChange).toHaveBeenCalledWith("half");
  await user.click(screen.getByRole("button", { name: "전체 결과 보기" }));
  expect(onSnapChange).toHaveBeenCalledWith("full");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm --filter @jangnal-map/web test -- src/components/mobile-market-sheet.test.tsx`

Expected: FAIL because the sheet component and snap actions do not exist.

- [ ] **Step 3: Implement controlled snap behavior**

Create `MobileMarketSheet` with `collapsed`, `half`, and `full` CSS heights under 700px. Use pointer capture on the handle, `touch-action: none`, and a release threshold that selects the nearest snap state. Add explicit native buttons with labels `결과 펼치기`, `전체 결과 보기`, and `지도 보기`; expose the current state through `data-snap` and `aria-live="polite"` result text.

- [ ] **Step 4: Add mobile home layout and state wiring**

In `MarketExplorerContent`, render the existing filters above a full-height `.mobile-explorer-stage`, `MarketMap` in the map layer, and `MobileMarketSheet` over it. Keep the desktop three-column grid for widths above 700px. When `selectedMarket` exists, switch the sheet to `mode="detail"`, `snap="half"`, and render `MarketDetail`; closing it returns to `mode="results"` and the previous snap state.

- [ ] **Step 5: Make filters compact and native-date friendly**

Update `MarketFilters` so mobile filter pills are a horizontally scrollable row with `aria-pressed` state, and the direct date is opened from a labeled `날짜` button. Keep the existing `onModeChange`, `onQueryChange`, and `onDirectDateChange` callbacks and URL semantics unchanged. Ensure the search input remains the first focusable control after the app bar.

- [ ] **Step 6: Add failure and recovery behavior**

When `MarketMap` has no client ID or reports an SDK error, set the sheet to `mode="results"`, `snap="full"`, and show the existing list fallback. When `useQuery` fails, render the retry state in the full sheet. When location permission fails, show a labeled region-search action that focuses the search input. When a filter excludes the selected market, clear `selectedId` and keep the current query/date state.

- [ ] **Step 7: Preserve selection and map view across sheet transitions**

Keep `MarketMap` mounted while the sheet changes so its center and zoom do not reset. Add a `data-selected-market` label and `aria-live` announcement for selected market name and next date. Ensure `onClose` restores focus to the originating pin/list button.

- [ ] **Step 8: Run component and type tests**

Run: `pnpm --filter @jangnal-map/web test -- src/components/mobile-market-sheet.test.tsx src/components/market-explorer.test.tsx src/components/market-filters.test.tsx src/components/market-map.test.tsx`

Expected: PASS. Then run `pnpm typecheck` and expect PASS.

- [ ] **Step 9: Commit the home explorer**

```bash
git add apps/web/src/components/mobile-market-sheet.tsx apps/web/src/components/mobile-market-sheet.test.tsx apps/web/src/components/market-explorer.tsx apps/web/src/components/market-filters.tsx apps/web/src/components/market-map.tsx apps/web/src/components/market-detail.tsx apps/web/src/components/market-explorer.test.tsx apps/web/src/components/market-filters.test.tsx apps/web/src/app/globals.css
git commit -m "feat: redesign mobile market explorer"
```

### Task 3: Mobile market detail and navigation states

**Files:**
- Modify: `apps/web/src/components/market-detail.tsx`
- Create: `apps/web/src/components/market-detail.test.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.module.css`
- Modify: `apps/web/src/components/market-share-button.tsx`
- Modify: `apps/web/src/app/markets/[slug]/page.test.tsx`
- Modify: `apps/web/src/components/market-share-button.test.tsx`
- Modify: `apps/web/src/app/globals.css`

**Interfaces:**
- `MarketDetail` continues to accept `{ market, today, onClose }`; its mobile close action must call `onClose` and restore focus to the selected origin through the explorer.
- The standalone market route continues to render the same SEO content and canonical URL; only mobile grouping and action placement change.

- [ ] **Step 1: Add failing content-order and focus tests**

```tsx
it("puts the next date before visit actions on mobile detail", () => {
  render(<MarketDetail market={marketFixture} today={new Date(2026, 8, 3)} onClose={vi.fn()} />);
  const detail = screen.getByRole("article", { name: /통복시장/ });
  expect(detail.textContent?.indexOf("다음 장날")).toBeLessThan(detail.textContent?.indexOf("방문 정보") ?? 0);
  expect(screen.getByRole("button", { name: "시장 상세 닫기" })).toHaveAttribute("aria-label");
});
```

- [ ] **Step 2: Run the focused tests and verify the new assertions fail or expose current ordering**

Run: `pnpm --filter @jangnal-map/web test -- src/components/market-detail.test.tsx 'src/app/markets/[slug]/page.test.tsx'`

Expected: the new mobile-specific assertions fail until the detail structure and route action layout are updated.

- [ ] **Step 3: Implement mobile detail hierarchy**

Keep the existing data and schedule components but order the mobile sections as market identity, next date, seven-day timeline, visit information, directions/share, Onnuri summary, source/report. Give the detail sheet a visible drag handle, explicit close button, safe-area bottom padding, and a scroll container independent from the map.

- [ ] **Step 4: Add standalone detail action treatment**

On `/markets/[slug]`, preserve the desktop article card and use a mobile-only bottom action bar for directions when coordinates exist. Add enough bottom padding to prevent the bar from covering source content. If coordinates are absent, show `위치 확인 필요` in the information section and do not render a dead directions button.

- [ ] **Step 5: Keep sharing and report actions resilient**

Ensure native share cancellation clears stale feedback, clipboard fallback remains labeled, and the market report link preserves the market ID. Keep all external links with `target="_blank"` and `rel="noreferrer"` where they already exist.

- [ ] **Step 6: Run detail tests and commit**

Run: `pnpm --filter @jangnal-map/web test -- src/components/market-detail.test.tsx src/components/market-share-button.test.tsx 'src/app/markets/[slug]/page.test.tsx'`

Expected: PASS.

```bash
git add apps/web/src/components/market-detail.tsx 'apps/web/src/app/markets/[slug]/page.tsx' 'apps/web/src/app/markets/[slug]/page.module.css' apps/web/src/components/market-share-button.tsx apps/web/src/components/market-share-button.test.tsx 'apps/web/src/app/markets/[slug]/page.test.tsx' apps/web/src/app/globals.css
git commit -m "feat: optimize mobile market detail"
```

### Task 4: Onnuri, report, privacy, and form ergonomics

**Files:**
- Modify: `apps/web/src/app/onnuri/page.module.css`
- Modify: `apps/web/src/components/onnuri-summary.module.css`
- Modify: `apps/web/src/app/report/page.module.css`
- Modify: `apps/web/src/components/report-form.tsx`
- Modify: `apps/web/src/components/report-form.test.tsx`
- Modify: `apps/web/src/app/privacy/page.tsx`
- Modify: `apps/web/src/app/onnuri/page.test.tsx`
- Modify: `apps/web/src/app/report/page.test.tsx`
- Modify: `apps/web/src/app/privacy/page.test.tsx`

**Interfaces:**
- `ReportForm` keeps its current props and submission contract; only focus management, labels, and mobile layout change.
- Existing `OnnuriSummary` data and source links remain unchanged.

- [ ] **Step 1: Write failing report focus test**

```tsx
it("focuses the first invalid field without clearing entered values", async () => {
  const user = userEvent.setup();
  render(<ReportForm configured supportEmail="help@example.com" scope="service" market={null} />);
  await user.type(screen.getByRole("textbox", { name: "알려주실 내용" }), "입력 내용");
  await user.click(screen.getByRole("button", { name: "제보 보내기" }));
  expect(screen.getByRole("radio", { name: /불편/ })).toHaveFocus();
  expect(screen.getByRole("textbox", { name: "알려주실 내용" })).toHaveValue("입력 내용");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm --filter @jangnal-map/web test -- src/components/report-form.test.tsx`

Expected: FAIL because validation currently reports errors without moving focus.

- [ ] **Step 3: Implement form focus and mobile-safe layout**

Add refs for the radio group and each invalid field, focus the first error after `setErrors`, and call `scrollIntoView({ block: "center" })` before focus. Preserve all existing field values when validation or submission fails. Set mobile form controls to 16px, maintain 44px consent/submit targets, and add bottom padding for safe-area insets.

- [ ] **Step 4: Reflow Onnuri and privacy content**

Remove mobile card width pressure from the Onnuri guide, stack the guide cards with readable line length, and keep the official link full-width only where it is the primary action. Render privacy as a document surface without the card shadow on mobile, with safe wrapping for email and external links.

- [ ] **Step 5: Run auxiliary page tests and commit**

Run: `pnpm --filter @jangnal-map/web test -- src/components/report-form.test.tsx src/app/onnuri/page.test.tsx src/app/report/page.test.tsx src/app/privacy/page.test.tsx src/components/onnuri-summary.test.tsx`

Expected: PASS.

```bash
git add apps/web/src/app/onnuri/page.module.css apps/web/src/components/onnuri-summary.module.css apps/web/src/app/report/page.module.css apps/web/src/components/report-form.tsx apps/web/src/components/report-form.test.tsx apps/web/src/app/privacy/page.tsx apps/web/src/app/onnuri/page.test.tsx apps/web/src/app/report/page.test.tsx apps/web/src/app/privacy/page.test.tsx
git commit -m "feat: improve mobile auxiliary pages"
```

### Task 5: Mobile browser regression suite

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/mobile-navigation.spec.ts`
- Create: `apps/web/e2e/mobile-auxiliary-pages.spec.ts`
- Create: `apps/web/e2e/mobile-overflow.spec.ts`

**Interfaces:**
- Playwright starts the production app with `pnpm --filter @jangnal-map/web start` after a build and uses `baseURL` from the test configuration.
- Tests use the existing static market data and do not require a Naver Maps key; map fallback is the expected deterministic state.

- [ ] **Step 1: Add the browser test dependency and configuration**

Run: `pnpm --filter @jangnal-map/web add -D @playwright/test`

Create `playwright.config.ts` with Chromium device projects for 320px, 375px, and 430px widths, `baseURL: "http://127.0.0.1:3100"`, a web server command of `pnpm --filter @jangnal-map/web start -- -p 3100`, and trace-on-first-retry.

- [ ] **Step 2: Write the home navigation flow**

```ts
test("finds a market through search and opens the mobile detail sheet", async ({ page }) => {
  await page.goto("/?when=all");
  await page.getByRole("searchbox").fill("평택");
  await page.getByRole("button", { name: /통복시장/ }).click();
  await expect(page.getByRole("article", { name: /통복시장/ })).toContainText("다음 장날");
  await page.getByRole("button", { name: "시장 상세 닫기" }).click();
  await expect(page.getByRole("button", { name: /통복시장/ })).toBeVisible();
});
```

- [ ] **Step 3: Add auxiliary page flows**

Cover `/markets/운천전통시장-45b640cc`, `/onnuri`, `/report?kind=service`, and `/privacy`. Assert that headings, primary actions, and report validation are visible at 375px, and that the market detail directions action is absent when coordinates are unavailable.

- [ ] **Step 4: Add overflow and console checks**

At each configured width, evaluate `document.documentElement.scrollWidth <= document.documentElement.clientWidth` and fail on console errors or failed same-origin requests. Capture screenshots for home collapsed sheet, home detail sheet, report form, and privacy content.

- [ ] **Step 5: Run the browser suite**

Run: `pnpm --filter @jangnal-map/web build && pnpm --filter @jangnal-map/web exec playwright test`

Expected: PASS for all configured widths with no horizontal overflow and no console errors.

- [ ] **Step 6: Commit the browser suite**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/playwright.config.ts apps/web/e2e
git commit -m "test: add mobile browser regression coverage"
```

### Task 6: Final verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-09-21-mobile-ux-redesign-design.md` only if implementation evidence changes a stated criterion.
- Create: `docs/verification/mobile-ux-2026-09-21.md`

- [ ] **Step 1: Run the complete automated verification**

Run: `pnpm test`

Expected: all workspace tests pass.

Run: `pnpm typecheck`

Expected: no TypeScript errors.

Run: `pnpm build`

Expected: Next.js production build completes.

- [ ] **Step 2: Run the manual device checklist**

Record results for iPhone Safari and Android Chrome: sheet drag/button transitions, browser back, native date picker, keyboard-visible report validation, safe-area padding, location allow/deny, external directions, and conditional install menu behavior.

- [ ] **Step 3: Record representative-task evidence**

Record the elapsed time for `평택 검색 → 시장 선택 → 다음 장날 확인` on both devices. The task passes only when it completes in 10 seconds or less without horizontal scrolling or an error recovery step.

- [ ] **Step 4: Write the verification report**

Create `docs/verification/mobile-ux-2026-09-21.md` with the tested commit, commands, viewport matrix, device results, representative-task times, known limitations, and screenshot paths. Do not claim completion for any untested device or flow.

- [ ] **Step 5: Commit verification evidence**

```bash
git add docs/verification/mobile-ux-2026-09-21.md
git commit -m "docs: record mobile UX verification"
```
