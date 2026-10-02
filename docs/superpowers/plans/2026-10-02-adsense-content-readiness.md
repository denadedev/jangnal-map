# AdSense content readiness implementation plan

Approved basis: the five-step plan in this chat; implementation requested by the user on 2026-10-02. Base: origin/main c421ec7.

Goal: keep the current map/search design while making the first HTML useful and market guidance specific, sourced and accurately dated. Approval by Google is not a testable guarantee.

- [x] Initial HTML: neutral date label until KST/URL restoration; loading/error states must not assert zero results. Add regression tests first.
- [x] Visit guides: five representative summaries available without JavaScript; all other reviewed links accessible through native disclosure; footer links inside the existing scrolling area. Preserve map/search behavior.
- [x] Editorial audit: inspect all 30 markets using official sources; enrich supported content, remove unsupported claims, retain unknowns and source-specific check dates. Record contradictions and evidence.
- [x] Provenance: show editorial review date separately from dataset date; sitemap uses the later catalog/editorial date. Correct verified catalog conflicts consistently across list, map and details.
- [x] Verify: pnpm test, pnpm typecheck, pnpm build, relevant Playwright regressions including no-JS, delayed/failed data, navigation and date selection. Review the final diff.

Constraints: no invented fees, hours or visits; no word-count gate; no bulk unrelated refactor. No production deployment or AdSense submission in this code-edit request. Production/Search Console checks remain a post-deployment checklist.

Execution ledger

- Existing isolated worktree reused on codex/adsense-content-readiness from origin/main.
- Setup: initial test command could not find vitest because dependencies were absent; pnpm install --frozen-lockfile completed, baseline rerun.
- Ruling: independent source research delegated into three disjoint temporary outputs; production integration and code changes remain sequential.

- Baseline after dependency installation: all unit/data/script tests passed.
- RED/GREEN evidence: initial HTML/loading failures reproduced and repaired; native guides/review dates/sitemap failures reproduced and repaired; Seogwipo catalog/source regression reproduced and repaired.
- Ruling: public catalog carries scheduleSource for the verified Seogwipo correction; generator reapplies the same narrow ID correction after identity creation to preserve URLs and future regeneration.
- Ruling: official source research found permanent-market closures; remove live-open claims and qualify daily SEO copy instead of adding speculative per-store holiday scheduling.
- Independent review found a P2 daily SEO inconsistency; corrected schedule answer, metadata and detail labels with regression tests. No other material code issue was reported.

- Final local verification: 306 unit/data/script tests, typecheck and production build passed. Browser suite excluding three pre-existing outdated design assertions passed 171 tests. Those design assertions were independently reproduced on the current production main; see docs/verification/adsense-content-readiness-2026-10-02.md.
- New shortcut hash/popstate conflict reproduced with E2E, then fixed via explicit in-page scrolling; no-JS anchor behavior retained.
- Post-deployment and Search Console/AdSense steps remain explicitly unchecked in the verification document; no deployment or submission performed.
