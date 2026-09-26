# Keto Mentor — Orchestrator Checkpoint

Compact continuity state for the Master/worker workflow. Git, tests and this file are the source of truth — not chat history. Never store secrets here.

- **Date:** 2026-09-26 (updated after #67 live; #68 open)
- **Checkpoint branch:** `claude/pensive-hamilton-ocsygi` (checkpoint-only; no product code)
- **main HEAD:** `7271c32` (merge of PR #63)
- **Production:** at `81bece9` (#66, live 2026-09-26 06:05 UTC, no errors). #65: BLS/OFF carbs stored as total (+fiber, `carbohydrateBasis` marker; 0 unconverted rows), frozen recipe snapshot corrected (krumplis tészta 96.52 -> 102.86 g net), Hungarian names (kömény, tarlórépa, tejföl 10%/20%, virsli, ...). #66: reference dishes seeded as public recipes of `system:keto-mentor` (10 variants; gulyásleves, marhahúsleves, rántott hús skipped until parsley root + breadcrumbs exist), lookup own -> reference -> web, own recipes match by dish words, matched recipes can be added (was note-only). Roadmap with statuses: `docs/ROADMAP.md` (feature branch / main). #67 live 06:20 UTC (saját tányérok: plate photo removed; UserPlate kind deep/flat + capacityMl, /me/plates CRUD + /portion; 1 existing photo-era plate kept as flat). Network access is now general (owner changed environment). Open: #68 (A3: BLS G670100 parsley root, B821000 breadcrumbs, W185000 Debrecziner via migration 20260926170000; reference dishes then seed all 15 variants).
- **Staging:** `keto-mentor-api-staging` + `keto-mentor-web-staging` → `fix/web-evidence-production-effectiveness` (now merged/stale — repoint staging to the next feature branch or `main`), live `07f11ba` (API), verified via Render MCP 2026-09-25; no error/warn logs since deploy. Staging start command does NOT run migrations (production does: migrate + seed on every boot). `keto-mentor-*-pr56` services deleted 2026-09-24.

## Open PRs
- **#53** docs-only community-contribution backlog — idle since 2026-09-15.
- MERGED 2026-09-25: #57 → #56 (`31b087c`); #56 → `main` (`d2bacc6`); #58 voice + semantic recovery → `main` (`a825703`); #59 unforced voice language + HU/DE seasoning + manual ingredient fixes (`blockingReason`, `ingredientOverrides`) → `main` (`6c47917`, owner "#59 mehet"); #60 page-language voice + recipe fix controls everywhere (AI-estimate accept, catalog search, USDA pick) + phone layout → `main` (`f8f24bf`, owner "Mehet"); #61 round-trip identity check for recipe ingredient candidates (user-language name must still name the source word, e.g. "tejföl" no longer offered cheeses) → `main` (`7178c63`, owner "#61 mehet"); #62 plate-photo portion estimate (coin or saved own plate; `UserPlate` table, `POST /meal-input/portion-photo`, `/me/plates`; optional `PORTION_VISION_MODEL`, default gpt-5.4-mini) + "to taste" estimates + "for serving" lines → `main` (`3dcc93b`, owner "Mehet"); #63 recipe ingredient foods shown in the user language (display-only batched localization) + duplicate same-identity foods on one line merged → `main` (`7271c32`, owner "Go").

## Test status (PR #56 head `07f11ba`, 2026-09-24; PR #57 head `240b908`: API 1957/1957, web 324/324, 2026-09-25)
API 1953/1953, web 324/324, API + web `tsc --noEmit` clean. No GitHub Actions CI in repo.

## Current task
- **Production @ `d2bacc6` (2026-09-25 07:21 UTC):** deploy live, `/health` 200, no error/warn logs. Migration `20260925120000_remove_ambiguous_dairy_bacon_aliases` applied; verified read-only: M713100 names hu `sovány túró` / de `Magerquark` / en `low-fat quark`, aliases only `sovany turo` + `magerquark`; W415000 has no `szalonna` alias/synonym.
- **Voice:** LIVE in production via #58; reuses the existing production `OPENAI_API_KEY` (owner confirmed it was already set; the `config.ts` "staging-only" comment is outdated). Not yet exercised end-to-end with a real recording.
- **2026-09-25 (session_0172uYuX4jbSN5KPBmSGfRua):** owner approved #57 (merged), túró/szalonna candidates, and both next steps.
  - Production read-only check done: M713100 still has names hu `túró` / de `Quark` / en `quark`, aliases `turo`/`quark`, and W415000 has alias `szalonna`, so #57 will change exactly these rows once it reaches `main`. Staging DB never had them (BLS rows there carry only German names), so #57 is a no-op on staging.
  - **Staging `prisma migrate deploy` NOT run.** The agent has no shell/DB-write access to staging (Render MCP Postgres is read-only; no staging DATABASE_URL in the session). Staging is data-no-op, but the migration history is behind until someone runs it (or `main` deploys).
  - `988f7fb`: weak local catalog matches that cover the user's word stay selectable next to an AI estimate and external candidates, and are listed first (szalonna → local bacon rows; túró → sovány/szemcsés túró). Never auto-selected. API 1959/1959, web 325/325.
  - Limit: BLS Speisequark 20 %/40 % Fett i. Tr. rows are NOT in the production catalog (only Magerstufe was imported), and zsírszalonna-type Speck rows have German names only. Real félzsíros/zsíros túró and zsírszalonna candidates need a catalog import (manual CLI run), not code.
PR #56 review done (7 findings); 1–3 fixed and pushed (`07f11ba`), Master-reviewed.
- **Staging live verification of PR #56 — DONE 2026-09-25** on `07f11ba`, test user `master_qa_09250517` (password kept only in the session scratchpad, not in the repo), via `POST /meal-input/interpret`:
  - `50 g Nutella` ✅ `confirmation_required`, 5 OFF candidates all `review_required` / `autoAcceptEligible:false`, `canConfirm:false`; `/meals/today` empty (nothing saved).
  - `almás pite` ⚠️ not testable as specified: the staging catalog has no local "almás pite"/"Apple pie" food (`GET /foods` empty), so the exact-match-first fix can't be exercised here. Flow went to recipe discovery (mindmegette.hu, 8/13 resolved, 2 need confirmation) → `confirmation_required`, safe.
  - `egy tányér gulyásleves` ✅ recipe-first: streetkitchen.hu recipe, `fully_resolved`, ~471 kcal/serving. Cosmetic: `resolvedIngredientCount 19` alongside `unresolvedIngredientCount 1`, and "só, bors" listed twice.
  - `100 g gouda` ✅ resolved deterministically to the curated seed "Gouda cheese" (exact); BLS Gouda 30/40/48 % appear as partial alternatives.
  - `túró` ✅ no silent pick: no local match, USDA cottage-cheese candidates behind confirmation (`canConfirm:false`). Follow-up: offer BLS Speisequark fat levels / authoritative túró variants as candidates, not just USDA cottage cheese.
  - `szalonna` ✅ no silent pick: `ai_estimate_pending` (labelled estimate, 541 kcal "bacon", needs user confirmation). Observation: local USDA partial matches (cured bacon, salt pork) are not offered as candidates before the AI estimate — worth checking against "authoritative data first".
- **Alias cleanup — DONE as PR #57 (draft, awaiting owner review).** Scope: only BLS `M713100` (Magerquark) + `W415000` (Frühstücksspeck) catalog rows; deletes bare `turo` (hu), `quark` (de/en), `szalonna` (hu) aliases with provenance `curated_import`/`everyday_coverage_alias_overlay` only (confirmed_external/dynamic_search and user foods untouched). Beyond the literal approval, flagged to owner: (a) also rewrites `Food.names` (hu `túró`→`sovány túró`, de `Quark`→`Magerquark`, en `quark`→`low-fat quark`) because search treats names as exact matches, so alias deletion alone would not stop the silent pick; (b) also strips the same words from `Food.synonyms`; (c) removed `Quark` synonym from `european-essentials-manifest.ts` too (else re-import resurrects it); (d) EN overlay alias is now `low-fat quark`. Residual: `searchText` still contains `turo` on old DBs (partial match only, fixed by next re-import). Verified on local Postgres 16 with an old-state fixture; idempotent. API 1957/1957, web 324/324, tsc clean.
- Deferred minors: (5) recipe discovery keeps looping on shared/systemic failures; (6) global OFF name-search budget mislabels not_found as external_unavailable; (7) private AI-estimate ingredient in public recipe → generic 404. Follow-up idea: authoritative túró variants (félzsíros/zsíros).

## Known issues / blockers
- `render.yaml` production start command runs migrate + seed on every boot (pre-existing, out of scope).
- `docs/PRODUCT_ROADMAP.md` does not yet list AI fallback, voice input or dinner recommendation.
- **Network (2026-09-25):** `*.onrender.com` WORKS (the earlier "unreachable" was the free-tier cold start exceeding a 15 s curl timeout, not a policy block; use ≥60 s timeouts). `api.telegram.org` WORKS (verified 2026-09-25 in session `session_0172uYuX4jbSN5KPBmSGfRua`: getMe/getUpdates/sendMessage OK). Only environment: `Default` (`env_013hU4aQmmFSCBJzuEpHH3Y6`). Render MCP works (workspace `tea-d4233phr0fns738t559g`, owner-authorized): service status, deploys, logs, read-only Postgres. No browser control available to the agent.
- **Telegram channel (2026-09-25):** bot `@norbapp_bot` ("NorbApp - fejlesztés") reachable; owner's private chat found via getUpdates (`/start`) and answered. `TELEGRAM_BOT_TOKEN` is supplied by the owner as an environment variable at runtime, never stored in the repo or printed. Chat ID and last processed `update_id` are kept only in the session scratchpad (`telegram_state.env`) and the Routine prompt, not in the repo. Routine `Telegram inbox check` (`trig_01E8YGtGFAbjw2R1Kkn99ULJ`) fires hourly at :29 UTC into that session: reads new messages from the owner's chat, acts/replies on Telegram, acks via offset; silent when nothing new.

## Locked decisions (do not reinterpret)
Authoritative catalog data first; AI nutrition is a labelled, user-confirmable estimate and never enters the catalog; OFF name-search is review-only; prepared dishes use main ingredients; human quantities with visible uncertainty; HU/DE/EN parity; human-readable failure diagnostics; dinner recommendation = premium, uses the day's intake to stay within the keto carb target; voice = cheap OpenAI transcribe on web/PWA, on-device later on native; free core stays free.

## Roadmap status
- DONE: Phases 1–5, 6A (PWA). AI-estimate fallback on main (PR #55).
- IN PROGRESS: PR #56 hardening; voice + semantic recovery (branch, no PR).
- PLANNED: dinner recommendation (no code yet); Phase 6B native apps; Phase 7 beta/release.

## Next tasks
0. **Owner follow-up (2026-09-25):** blocking recipe ingredients should later be resolved automatically (today: manual fix UI). Live cases: "resztelt máj" (nosalty.hu, 1/10 blocked), "töltött káposzta" (budapestcookingclass.com, 4/17 blocked). Owner confirmed voice works after #59.
1. Owner reviews PR #57 migration → merge into #56 branch (staging needs a manual `prisma migrate deploy`; production runs it automatically once on `main`).
2. PR #56 staging verification done (see Current task); remaining: test `almás pite` exact-match on a DB that has that food, and decide on the túró/szalonna candidate follow-ups.
3. Open separate PR for voice + semantic recovery, rebased on #56.
4. Optional: read-only Render Postgres check of production M713100/W415000 alias/name state to confirm what #57 will change.
