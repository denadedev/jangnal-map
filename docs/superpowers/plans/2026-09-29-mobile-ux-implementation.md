# Mobile Market Discovery UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the approved Open Design mobile discovery flow into the existing web app with real market data and map behavior.

**Architecture:** Keep the current market data, date rules, URL state, and NAVER map integration. Separate text matches from markets active in the selected period, then present both on mobile while leaving the desktop layout intact. Make map movement an explicit action and show visit-date evidence in the existing detail component.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Playwright, CSS modules/global CSS.

**Spec:** Open Design project `ux-cebe`, `jangnal-mobile-ux.html` and `ux-flow-notes.md`.

## Global Constraints

- Keep Korean copy and the current ivory, ink, and persimmon visual language.
- Use the 1,393 real markets and current NAVER map integration; never display prototype sample data as live data.
- Preserve working desktop and English discovery flows, links, URL restoration, and map failure fallback.
- Keep data reference dates distinct from field verification dates.
- Hold deployment until the user reviews the local preview; the user approved deployment on 2026-09-29.

## Review Focus

- A daily market searched under the default date filter remains findable.
- A named five-day market outside the chosen date remains findable with an accurate date status.
- An unknown schedule is never described as open or closed on a chosen date.
- A search does not move a map the user panned until the user requests that move.
- The selected date, next market day, and source date remain distinct in mobile detail.

---

### Task 1: Search and date result semantics

**Files:** `apps/web/src/components/market-explorer.tsx`, `apps/web/src/components/market-list.tsx`, `apps/web/src/lib/market-view.ts`, and their existing tests.

**Interfaces:** Derive all text matches independently of the date range; derive active matches from them. Give the result list active and inactive groups, including a direct recovery action for zero active matches.

- [x] Add failing tests for daily search, an inactive five-day market, unknown schedule, and zero active matches.
- [x] Run the focused tests and confirm expected failures.
- [x] Implement the smallest data split and result presentation.
- [x] Run the focused tests and confirm they pass.

### Task 2: Date labels and market detail

**Files:** `apps/web/src/components/market-filters.tsx`, `apps/web/src/components/market-detail.tsx`, `apps/web/src/components/market-preview.tsx`, `apps/web/src/lib/ui-copy.ts`, `apps/web/src/app/globals.css`, and their existing tests.

**Interfaces:** Show the exact active period. Pass the selected visit date in both locales. Keep today's next market day separate; add the selected month's market days and source evidence near the timing card.

- [x] Add failing tests for the Korean visit date, non-market-day status, monthly dates, source date, and seven-day/weekend labels.
- [x] Run the focused tests and confirm expected failures.
- [x] Implement the date and evidence hierarchy with minimum component changes.
- [x] Run the focused tests and confirm they pass.

### Task 3: Explicit search-result map movement

**Files:** `apps/web/src/components/market-map.tsx`, `apps/web/src/lib/naver-maps.ts`, `apps/web/src/components/market-explorer.tsx`, and map tests.

**Interfaces:** Offer a result-map action when a query has located matches, including when they are inside a nationwide viewport. Move only on that action and preserve a way back to the previous map camera.

- [x] Add a failing map test proving search alone does not move the camera and the explicit action does.
- [x] Run it and confirm the expected failure.
- [x] Implement the action and camera restoration using existing map APIs.
- [x] Run the focused map tests and confirm they pass.

### Task 4: Mobile presentation and verification

**Files:** `apps/web/src/components/market-explorer.tsx`, `apps/web/src/components/mobile-home-controls.tsx`, `apps/web/src/components/mobile-market-sheet.tsx`, `apps/web/src/app/globals.css`, and relevant tests.

**Interfaces:** Apply the approved mobile hierarchy: brand/search, date chips, active range, map/list results, and visible route to full detail. Keep desktop styling scoped outside the mobile breakpoint.

- [x] Add a failing interaction test for the connected mobile discovery and detail flow.
- [x] Run it and confirm the expected failure.
- [x] Apply the mobile layout and interaction changes.
- [x] Run focused tests, `pnpm test`, `pnpm typecheck`, `pnpm build`, and relevant Playwright flows.
- [x] Inspect mobile and desktop screenshots; check `git diff` for unrelated changes.

## Implementation decision

The prototype used four example markets. In the real catalog, 982 of 1,393 markets have daily schedules; showing all of them in the unsearched default date view would obscure five-day markets. The default view remains focused on periodic market days, while name and region searches cover the full catalog and show daily schedules explicitly.
