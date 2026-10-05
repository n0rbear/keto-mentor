# Keto Mentor — Orchestrator Checkpoint

Compact continuity state for the Master/worker workflow. Git, tests and this file are the source of truth — not chat history. Never store secrets here.

- **Date:** 2026-10-05
- **Checkpoint branch:** `claude/pensive-hamilton-ocsygi` (checkpoint-only; no product code)
- **main HEAD:** `e0115e6` (merge of PR #76, 2026-10-01)
- **Production:** `keto-mentor-api` / `-web` live at `e0115e6`. Catalog lives in the shared prod Postgres (`driverassistant` instance), schema `ketomentor`; read-only queries work via Render MCP (2026-10-05: bls 617, usda_fdc 465, chain_official 1).
- **Staging DB:** `keto-mentor-staging-db` is a free-plan instance that **expires 2026-10-13**.
- **Staging services** still track `fix/web-evidence-production-effectiveness` (merged, stale) — repoint to the next feature branch or `main` before staging verification. Staging start does NOT run migrations.
- **Network:** general access. `*.onrender.com` (free-tier cold start: use ≥60 s timeouts), `api.telegram.org`, `blsdb.de` reachable. Render MCP: workspace `tea-d4233phr0fns738t559g`, read-only Postgres.
- **Roadmap with statuses:** `docs/ROADMAP.md` (Hungarian navigation list; authoritative for feature status).

## Since the last checkpoint (merged)
#56 hardening, #57 alias cleanup (túró/Quark/szalonna), #58 voice + semantic recovery, #59–#72 owner-beta fixes, #73/#74 regional brief (`docs/REGIONAL_DATABASE_BRIEF.md`), #75 regional phase 1 (per-country source format, generator, seed, `chain_official`), #76 regional phase 2 (full HU set: 62 traditional / 60 everyday / 25 street food; BLS migration `20260927120000_bls_regional_hu`), #77.

## Open
- **PR #53** docs-only community backlog (idle).
- **PR #78** `docs/regional-fix-list` — fix list (3 skipped HU dishes, 11 missing ingredients, K-1…K-3, D-1). Docs only, awaiting owner.
- **PR #79** `feat/regional-database-phase3` @ `c1e6330` — full AT set (65/62/26 vs 60/60/25; 22 reused HU dishes gained AT), migration `20261005120000_bls_regional_at` (67 BLS ids, insert-only; 28 already in prod → only qualified aliases added). API 2150, web 368, tsc clean, build deterministic. Owner decisions listed in the PR: Extrawurst/Kornspitz/Graukäse/Sauerrahm/Knödelbrot mappings, bare de-AT `Rahm`/`Obers` synonyms, Langos reuse. No staging check yet.

## Regional methodology (from #75/#76 — follow exactly)
Source of truth = Python modules in `data/reference-dishes/` (`at.py`, `hu*.py`, `common.py`, `foods.py`); `build.py` validates/derives; generated TS data + idempotent seed. Every dish: countries, category, aliases per `hu`/`de`/`de-AT`/`en`, ≥2 dated recipe sources, every ingredient → existing BLS/USDA catalog record (BLS first, then USDA; OFF only branded, `chain_official` only chains). Never invent or hand-type nutrition; never substitute — missing record → `<country>-missing-foods.md`, or import from the official BLS 4.0 xlsx via `BlsAdapter`/`bls-migration-sql.ts` in an insert-only migration. Carbs stored total = available + fiber. Rules: `common.MEASURE_G`, `FAT_RETENTION` (drippings), `BOILED_YIELD`, `breaded()`. Per-dish BLS cross-check; >15 % needs a written reason. Minimums counted on built dishes only (no side variants). Build twice → byte-identical. API + web tests and `tsc` green.

## Next tasks
1. Owner review of #78 and #79 (no merge by Master).
2. Before staging verification: repoint staging services to the feature branch; staging DB expires 2026-10-13 (owner decision: upgrade or recreate).
3. Later: fix-list items (USDA import migration for HU-1/3/4–12 + AT gaps; K-1/K-2; BlsAdapter "TR"/"<LOD" handling for dry wines), phase 4 DE, phase 5 chains, phase 6 unit weights/aliases.

## Known issues
- `render.yaml` prod start runs migrate + seed on every boot (pre-existing).
- `docs/PRODUCT_ROADMAP.md` does not list AI fallback, voice, regional DB, dinner recommendation.
- Telegram (`@norbapp_bot`): token supplied by the owner at runtime, never stored in the repo. An hourly Routine `Telegram inbox check` (`trig_01E8YGtGFAbjw2R1Kkn99ULJ`) was created by session `session_0172uYuX4jbSN5KPBmSGfRua` — check before creating another.
- Owner follow-ups: blocking recipe ingredients should later resolve automatically (today manual fix UI); real félzsíros/zsíros túró (BLS Speisequark 20/40 %) and zsírszalonna need a catalog import.

## Locked decisions (do not reinterpret)
Authoritative catalog data first; AI nutrition is a labelled, user-confirmable estimate and never enters the catalog; OFF name-search is review-only; prepared dishes use main ingredients; human quantities with visible uncertainty; HU/DE/EN parity; human-readable failure diagnostics; dinner recommendation = premium, uses the day's intake to stay within the keto carb target; voice = cheap OpenAI transcribe on web/PWA, on-device later on native; free core stays free.

## Roadmap status
- DONE: Phases 1–5, 6A (PWA), AI-estimate fallback, voice input, regional DB phases 1–2 (HU).
- IN REVIEW: regional phase 3 (AT) #79.
- PLANNED: regional phases 4–6; dinner recommendation (no code yet); Phase 6B native apps; Phase 7 beta/release.
