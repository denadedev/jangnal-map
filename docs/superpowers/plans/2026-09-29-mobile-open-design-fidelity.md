# Mobile Open Design Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved local Open Design artifact into a runnable Next.js/React prototype and match its connected mobile screens in the live app without changing desktop discovery.

**Architecture:** Keep the existing market data, URL state, and NAVER map. Render mobile map and results in one scrolling page rather than a result sheet; the map/list controls change whether the map card is shown. Market selection opens the existing full-screen detail, while the bottom navigation uses the prototype's three icon-and-label items.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Vitest, Playwright.

**Spec:** Local Open Design `jangnal-mobile-ux.html` and `ux-flow-notes.md` in project `ux-cebe`, approved in this chat. The 375–430px home and list screens are the visual references.

## Global Constraints

- Use the real market catalog and current NAVER map; prototype example market counts and drawn map are not live data.
- Preserve English copy, desktop layout, browser history, date filtering, and map failure recovery.
- Run automated and visual checks, then deploy without waiting for another user review, as requested on 2026-09-29.

## Review Focus

- At 375 and 430px, the default map and market list occupy normal scroll flow with no result-sheet handle or overlay.
- List navigation hides the map; map navigation restores it with results below.
- Map failure still leaves the real result list reachable.
- Returning from List to Map refreshes the real NAVER map size.
- Each date chip has the same 44px height, 13px text, and 15px horizontal padding.
- Bottom navigation has map/list/search icons, an active state, and a working search action.

---

### Task 0: Runnable local Open Design project

**Files:** Create `package.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, and `README.md` in the local Open Design project folder. Keep `jangnal-mobile-ux.html` unchanged.

**Interfaces:** Use the existing four example markets and design tokens in the HTML. Preserve home map/list, separate search, date picking, detail, route choices, and map-error states in React.

- [x] Extract the existing design's CSS and implement the connected screens with React state.
- [x] Install dependencies and verify `pnpm build` and a browser smoke test in that folder.

### Task 1: Mobile page structure

**Files:** `apps/web/src/components/market-explorer.tsx`, `apps/web/src/app/globals.css`, mobile explorer and Playwright tests.

**Interfaces:** Keep `MarketList` and `MarketMap` unchanged as data sources. Change their mobile composition and map/list visibility. Market pin selection opens full detail.

- [x] Add a failing mobile test for inline results, map/list switching, and direct detail.
- [x] Run it and confirm the current result sheet fails the expectation.
- [x] Render map and results in normal scroll flow; keep the full-screen detail path.
- [x] Run the focused tests until green.

### Task 2: Prototype navigation, search, and chips

**Files:** `apps/web/src/components/market-explorer.tsx`, `apps/web/src/components/market-filters.tsx`, `apps/web/src/app/globals.css`, relevant Playwright tests.

**Interfaces:** Use the existing map/list view state; add the prototype's icons and active colors. Home search and bottom Search open the dedicated search screen. Apply the prototype's chip geometry and selected-date label on mobile only.

- [x] Add failing browser tests for nav icons and selected state, separate search, chosen-date label, and equal chip geometry at 375 and 430px.
- [x] Run it and confirm the current design fails.
- [x] Implement the search screen and scoped mobile CSS with accessible icon labels.
- [x] Run focused browser tests until green.

### Task 3: Final verification

**Files:** Tests affected by replacing result-sheet behavior, plus this plan.

- [x] Update obsolete result-sheet assertions to the approved screen behavior.
- [x] Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and the mobile Playwright suite.
- [x] Compare new 375/430px screenshots with the local Open Design map and list screens.
- [x] Compare the production UI to the local Open Design home, list, search, date, detail, and map-error states.
- [ ] Open a PR, merge after CI, and verify GitOps and the public site.
