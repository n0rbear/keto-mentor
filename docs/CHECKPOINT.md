# Keto Mentor — Orchestrator Checkpoint

Compact continuity state for the Master/worker workflow. Git, tests and this file are the source of truth — not chat history. Never store secrets here.

- **Date:** 2026-09-24
- **Checkpoint branch:** `claude/pensive-hamilton-ocsygi` (checkpoint-only; no product code)
- **main HEAD:** `3ed31a3` (merge of PR #55)
- **Production:** `keto-mentor-api` / `keto-mentor-web` at `3ed31a3` (auto-deploy from `main`)
- **Staging:** `keto-mentor-api-staging` / `-web-staging` track `feat/authoritative-external-evidence-fallback` = `bd9a120` (includes voice + semantic recovery). Owner decision 2026-09-24: repoint staging to `fix/web-evidence-production-effectiveness` (PR #56) and delete the `keto-mentor-*-pr56` services (API crashes: no `DATABASE_URL`). Render MCP cannot change branch/delete services — owner does this in the dashboard.

## Open PRs
- **#56** `fix/web-evidence-production-effectiveness` @ `9209632` — draft, mergeable. Food-resolution hardening, `autoAcceptEligible` evidence policy, HMAC-bound AI-estimate acceptance, recipe-first prepared dishes, localized diagnostics.
- **#53** docs-only community-contribution backlog — idle since 2026-09-15.

## Unmerged work without PR
- `feat/semantic-recovery-and-voice-input` (= `feat/authoritative-external-evidence-fallback`) @ `bd9a120`: 13 commits on top of the PR #56 fork point `f54f740` — voice input (`gpt-4o-mini-transcribe`), LLM semantic recovery, `decideSurvivorAcceptance` / `resolveFoodConcept` shared engine. Owner decision: ship as a **separate PR after #56**, rebased onto it.

## Test status (PR #56 head, 2026-09-24)
API 1941/1941, web 324/324, API + web `tsc --noEmit` clean. No GitHub Actions CI in repo.

## Current task
Independent read-only review of PR #56 against locked invariants.

## Known issues / blockers
- `render.yaml` production start command runs migrate + seed on every boot (pre-existing, out of scope).
- `docs/PRODUCT_ROADMAP.md` does not yet list AI fallback, voice input or dinner recommendation.
- Telegram reporting unavailable: only the bot id was supplied, not a full `id:secret` token.

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
