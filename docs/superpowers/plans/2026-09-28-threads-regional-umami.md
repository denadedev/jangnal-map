# Threads Regional Content and Umami Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish three date-correct 5-day markets from one region per Threads post and measure site arrivals per post without exposing the URL in reply text.

**Architecture:** Next.js captures a validated `utm_campaign` before homepage URL cleanup and records one Umami `threads_entry` event. n8n chooses a region from real market data, composes factual copy, and attaches a campaign URL as a link card. Deploy the site before updating the active workflow.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, self-hosted Umami, n8n Code/HTTP nodes.

**Spec:** `docs/superpowers/specs/2026-09-28-threads-regional-umami-design.md`

## Global Constraints

- Preserve the production schedule: every day 08:30 and Monday–Saturday 20:30 Asia/Seoul.
- Preserve existing account, duplicate, draft-expiry, publication, polling, and Slack error guards.
- Do not run the workflow manually; its trigger can publish a real Threads post.
- Do not store or print credentials or tokens.
- Keep Umami's `data-exclude-search="true"`; send only a validated campaign code as event data.
- The reply text contains no URL; `link_attachment` contains the entire campaign URL.
- Apply the region only to selecting and describing the three featured markets. The site and card link retain their existing date-based list; do not add a region filter or region query parameter.

## Review Focus

- Empty or malformed market data must skip publishing, not invent a region.
- All three examples must be operating 5-day markets in the same region and target date.
- Missing, duplicate, malformed, or mismatched UTM parameters must not emit an event or block browsing.
- A delayed or blocked analytics script must not break market exploration.
- Previously saved drafts and older URLs must remain usable through rollout and rollback.

---

### Task 1: Validate and record campaign arrivals on the site

**Files:** Create `apps/web/src/lib/threads-campaign.ts`; create `apps/web/src/lib/threads-campaign.test.ts`; modify `apps/web/src/components/market-explorer.tsx`; modify `apps/web/src/components/market-explorer.test.tsx`.

**Interfaces:** `parseThreadsCampaign(search: string): string | null` accepts only `utm_source=threads`, a unique 12-digit `YYYYMMDDHHMM` campaign for an actual 08:30 or 20:30 slot, and a `when=date&date=` target matching the encoded morning date or following day after an evening slot. `startThreadsEntryTracking(code: string): () => void` emits the Umami custom event `{ campaign: code }` once per page mount when the tracker becomes available and returns a cleanup function.

- [x] Add failing tests for valid morning/evening and month boundary codes, then malformed/duplicate/mismatched code, unrelated source, no UTM, and URL cleanup after capture.
- [x] Run focused tests and confirm the intended failures.
- [x] Implement pure parsing, capture in the first market-explorer URL restoration effect before `replaceState`, and best-effort one-time Umami event dispatch without blocking browsing.
- [x] Run focused tests until green. Verify the tracker configuration remains `data-exclude-search="true"`.

### Task 2: Change regional selection, factual copy, and card URL in n8n

**Files:** Update existing workflow `REMI1nbU4mCOYtR2` nodes `주제 선정 · 기준 수정` and `문구 검사 · 답글 설정`; update the canvas guidance note. Keep `답글 1개 준비`'s `link_attachment` binding. Use local temporary test fixtures rather than storing workflow secrets in Git.

**Interfaces:** topic output retains `selected_markets`, `candidate_count`, `jangnal_count`, `market_url`, `post_key`, and adds `selected_region`, `campaign_code`. `market_url` is the date URL with `utm_source=threads&utm_campaign=<code>`. Validated output retains `main_text`, `reply_text`, and `topic_audit`.

- [x] Create failing, read-only fixtures for region selection, no eligible region, bad region spelling, duplicate markets, date crossover, URL validation, and URL-free reply text.
- [x] Run fixtures against the current node code and confirm expected failures.
- [x] Update selection to choose three eligible 5-day markets from one safe region after cooldown; insert that region in the factual heading and audit data. Keep national aggregate counts as context.
- [x] Update the code validator and reply text. Preserve URL only in `market_url`; the existing Threads HTTP node sends it as `link_attachment`.
- [x] Re-run fixtures and n8n node/schema validation. Compare the final graph and schedule to the active baseline.

### Task 3: Roll out in dependency order

**Files:** Site deployment, then n8n workflow draft and published version.

- [x] Run `pnpm test`, `pnpm typecheck`, and `pnpm build`; inspect the site diff.
- [ ] Deploy the site through the project's normal release flow. Verify a QA campaign in Umami and unchanged browsing with missing/bad codes.
- [ ] Apply the validated minimal n8n update only after the site collects events. Read back the draft, publish it, and confirm the active version and unchanged schedule. Do not manually execute a publish trigger.
- [ ] Inspect the first scheduled draft and first automatic post for one region, correct facts, card-only URL, and a matching Umami entry. Roll back n8n if facts or links are wrong; keep published links functional on the site.
