# Keto Mentor — Orchestrator Checkpoint

Compact continuity state for the Master/worker workflow. Git, tests and this file are the source of truth — not chat history. Never store secrets here.

- **Date:** 2026-09-25
- **Checkpoint branch:** `claude/pensive-hamilton-ocsygi` (checkpoint-only; no product code)
- **main HEAD:** `3ed31a3` (merge of PR #55)
- **Production:** `keto-mentor-api` / `keto-mentor-web` at `3ed31a3` (auto-deploy from `main`)
- **Staging:** `keto-mentor-api-staging` + `keto-mentor-web-staging` → `fix/web-evidence-production-effectiveness`, live `07f11ba` (API). `keto-mentor-*-pr56` services deleted 2026-09-24.

## Open PRs
- **#56** `fix/web-evidence-production-effectiveness` @ `9209632` — draft, mergeable, head `07f11ba` (PR #56 + review fixes 1–3). Food-resolution hardening, `autoAcceptEligible` evidence policy, HMAC-bound AI-estimate acceptance, recipe-first prepared dishes, localized diagnostics.
- **#53** docs-only community-contribution backlog — idle since 2026-09-15.

## Unmerged work without PR
- `feat/semantic-recovery-and-voice-input` (= `feat/authoritative-external-evidence-fallback`) @ `bd9a120`: 13 commits on top of the PR #56 fork point `f54f740` — voice input (`gpt-4o-mini-transcribe`), LLM semantic recovery, `decideSurvivorAcceptance` / `resolveFoodConcept` shared engine. Owner decision: ship as a **separate PR after #56**, rebased onto it.

## Test status (PR #56 head `07f11ba`, 2026-09-24)
API 1953/1953, web 324/324, API + web `tsc --noEmit` clean. No GitHub Actions CI in repo.

## Current task
PR #56 review done (7 findings); 1–3 fixed and pushed (`07f11ba`), Master-reviewed.
- **Staging live verification of PR #56 still open.** This cloud session cannot reach `*.onrender.com` or `api.telegram.org` (network policy). Owner chose: Master creates its own staging test user and tests — needs a session where `onrender.com` is allowed. Checks: `50 g Nutella` (OFF candidates behind confirmation, nothing auto-saved), `almás pite` (exact match first), `egy tányér gulyásleves` (recipe-first), `100 g gouda`, `túró`/`szalonna` (no silent pick).
- **Alias cleanup — owner APPROVED (2026-09-25):** delete bare `szalonna`, `túró`, `turo`, `Quark`, `quark` overlay aliases from existing DBs (incl. production on next deploy) and remove bare `Quark`/`quark` from `everyday-coverage-manifest.ts`; keep qualified aliases (`sovány túró`, `Magerquark`, `szemcsés túró`, `bacon`, `Frühstücksspeck`). Overlay only upserts, so a tightly scoped forward-only migration is needed. Blocked in this session by the auto-mode safety classifier (classified as production deploy) — owner must allow it in permission settings, then run it as a worker on a local branch; show migration to owner before merge.
- Deferred minors: (5) recipe discovery keeps looping on shared/systemic failures; (6) global OFF name-search budget mislabels not_found as external_unavailable; (7) private AI-estimate ingredient in public recipe → generic 404. Follow-up idea: authoritative túró variants (félzsíros/zsíros).

## Known issues / blockers
- `render.yaml` production start command runs migrate + seed on every boot (pre-existing, out of scope).
- `docs/PRODUCT_ROADMAP.md` does not yet list AI fallback, voice input or dinner recommendation.
- Telegram: owner allowed `api.telegram.org` in the environment network policy; takes effect only in a new session. Token is supplied by the owner at runtime, never stored in the repo.

## Locked decisions (do not reinterpret)
Authoritative catalog data first; AI nutrition is a labelled, user-confirmable estimate and never enters the catalog; OFF name-search is review-only; prepared dishes use main ingredients; human quantities with visible uncertainty; HU/DE/EN parity; human-readable failure diagnostics; dinner recommendation = premium, uses the day's intake to stay within the keto carb target; voice = cheap OpenAI transcribe on web/PWA, on-device later on native; free core stays free.

## Roadmap status
- DONE: Phases 1–5, 6A (PWA). AI-estimate fallback on main (PR #55).
- IN PROGRESS: PR #56 hardening; voice + semantic recovery (branch, no PR).
- PLANNED: dinner recommendation (no code yet); Phase 6B native apps; Phase 7 beta/release.

## Next tasks
1. Review findings on PR #56 → fix worker if needed.
2. Staging live verification of PR #56 after owner repoints staging.
3. Open separate PR for voice + semantic recovery, rebased on #56.
