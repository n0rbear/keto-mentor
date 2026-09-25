# Keto Mentor — Orchestrator Checkpoint

Compact continuity state for the Master/worker workflow. Git, tests and this file are the source of truth — not chat history. Never store secrets here.

- **Date:** 2026-09-25 (updated after PR #57)
- **Checkpoint branch:** `claude/pensive-hamilton-ocsygi` (checkpoint-only; no product code)
- **main HEAD:** `3ed31a3` (merge of PR #55)
- **Production:** `keto-mentor-api` / `keto-mentor-web` at `3ed31a3` (auto-deploy from `main`)
- **Staging:** `keto-mentor-api-staging` + `keto-mentor-web-staging` → `fix/web-evidence-production-effectiveness`, live `07f11ba` (API), verified via Render MCP 2026-09-25; no error/warn logs since deploy. Staging start command does NOT run migrations (production does: migrate + seed on every boot). `keto-mentor-*-pr56` services deleted 2026-09-24.

## Open PRs
- **#56** `fix/web-evidence-production-effectiveness` @ `9209632` — draft, mergeable, head `07f11ba` (PR #56 + review fixes 1–3). Food-resolution hardening, `autoAcceptEligible` evidence policy, HMAC-bound AI-estimate acceptance, recipe-first prepared dishes, localized diagnostics.
- **#57** `claude/checkpoint-docs-review-nww6jw` @ `240b908` → base `fix/web-evidence-production-effectiveness` (stacked on #56), draft — owner-approved alias cleanup: forward-only migration `20260925120000_remove_ambiguous_dairy_bacon_aliases` + manifest changes. Awaiting owner review of the migration before merge.
- **#53** docs-only community-contribution backlog — idle since 2026-09-15.

## Unmerged work without PR
- `feat/semantic-recovery-and-voice-input` (= `feat/authoritative-external-evidence-fallback`) @ `bd9a120`: 13 commits on top of the PR #56 fork point `f54f740` — voice input (`gpt-4o-mini-transcribe`), LLM semantic recovery, `decideSurvivorAcceptance` / `resolveFoodConcept` shared engine. Owner decision: ship as a **separate PR after #56**, rebased onto it.

## Test status (PR #56 head `07f11ba`, 2026-09-24; PR #57 head `240b908`: API 1957/1957, web 324/324, 2026-09-25)
API 1953/1953, web 324/324, API + web `tsc --noEmit` clean. No GitHub Actions CI in repo.

## Current task
PR #56 review done (7 findings); 1–3 fixed and pushed (`07f11ba`), Master-reviewed.
- **Staging live verification of PR #56 still open.** This cloud session cannot reach `*.onrender.com` or `api.telegram.org` (network policy). Owner chose: Master creates its own staging test user and tests — needs a session where `onrender.com` is allowed. Checks: `50 g Nutella` (OFF candidates behind confirmation, nothing auto-saved), `almás pite` (exact match first), `egy tányér gulyásleves` (recipe-first), `100 g gouda`, `túró`/`szalonna` (no silent pick).
- **Alias cleanup — DONE as PR #57 (draft, awaiting owner review).** Scope: only BLS `M713100` (Magerquark) + `W415000` (Frühstücksspeck) catalog rows; deletes bare `turo` (hu), `quark` (de/en), `szalonna` (hu) aliases with provenance `curated_import`/`everyday_coverage_alias_overlay` only (confirmed_external/dynamic_search and user foods untouched). Beyond the literal approval, flagged to owner: (a) also rewrites `Food.names` (hu `túró`→`sovány túró`, de `Quark`→`Magerquark`, en `quark`→`low-fat quark`) because search treats names as exact matches, so alias deletion alone would not stop the silent pick; (b) also strips the same words from `Food.synonyms`; (c) removed `Quark` synonym from `european-essentials-manifest.ts` too (else re-import resurrects it); (d) EN overlay alias is now `low-fat quark`. Residual: `searchText` still contains `turo` on old DBs (partial match only, fixed by next re-import). Verified on local Postgres 16 with an old-state fixture; idempotent. API 1957/1957, web 324/324, tsc clean.
- Deferred minors: (5) recipe discovery keeps looping on shared/systemic failures; (6) global OFF name-search budget mislabels not_found as external_unavailable; (7) private AI-estimate ingredient in public recipe → generic 404. Follow-up idea: authoritative túró variants (félzsíros/zsíros).

## Known issues / blockers
- `render.yaml` production start command runs migrate + seed on every boot (pre-existing, out of scope).
- `docs/PRODUCT_ROADMAP.md` does not yet list AI fallback, voice input or dinner recommendation.
- **Network (2026-09-25):** in the new session `*.onrender.com` and `api.telegram.org` are STILL denied by the proxy (403), although the owner believed they were allowed — the setting was apparently not saved. Only environment: `Default` (`env_013hU4aQmmFSCBJzuEpHH3Y6`). Fix: session title bar → environment → Edit → Network access → broader level or add `*.onrender.com` + `api.telegram.org`; then open a new session. Render MCP works regardless (workspace `tea-d4233phr0fns738t559g`, owner-authorized): service status, deploys, logs, read-only Postgres. No browser control available to the agent.
- Telegram token is supplied by the owner at runtime, never stored in the repo.

## Locked decisions (do not reinterpret)
Authoritative catalog data first; AI nutrition is a labelled, user-confirmable estimate and never enters the catalog; OFF name-search is review-only; prepared dishes use main ingredients; human quantities with visible uncertainty; HU/DE/EN parity; human-readable failure diagnostics; dinner recommendation = premium, uses the day's intake to stay within the keto carb target; voice = cheap OpenAI transcribe on web/PWA, on-device later on native; free core stays free.

## Roadmap status
- DONE: Phases 1–5, 6A (PWA). AI-estimate fallback on main (PR #55).
- IN PROGRESS: PR #56 hardening; voice + semantic recovery (branch, no PR).
- PLANNED: dinner recommendation (no code yet); Phase 6B native apps; Phase 7 beta/release.

## Next tasks
1. Owner reviews PR #57 migration → merge into #56 branch (staging needs a manual `prisma migrate deploy`; production runs it automatically once on `main`).
2. Staging live verification of PR #56 — needs a session with `*.onrender.com` allowed (see Network).
3. Open separate PR for voice + semantic recovery, rebased on #56.
4. Optional: read-only Render Postgres check of production M713100/W415000 alias/name state to confirm what #57 will change.
