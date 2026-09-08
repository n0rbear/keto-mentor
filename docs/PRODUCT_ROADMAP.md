# Keto Mentor Product Roadmap — Locked Delivery Plan

This document is the authoritative product delivery order for Keto Mentor. Technical debt and feature ideas may support a phase, but they do not replace or reorder this plan without explicit product-owner approval.

## Status

| Phase | Status |
| --- | --- |
| Phase 1 — Understand what the user ate | DONE |
| Phase 2 — Human quantities and clarification | DONE |
| Phase 3 — Real meal diary | DONE |
| Phase 4 — Complete recipe experience | DONE |
| Phase 5 — Packaged food and barcode | DONE |
| Phase 6 — Mobile product | IN PROGRESS |
| — Phase 6A — Installable PWA + real-user validation | DONE |
| — Phase 6B — Native Android + iOS | NOT STARTED |
| Phase 7 — Beta and public release | NOT STARTED |

## Phase 1 — Understand what the user ate

Goal: natural Hungarian, German and English meal descriptions should be semantically understood.

Pipeline:

`deterministic parser → deterministic local Food resolver → AI food-NLP fallback when needed → existing trusted Food records → visible confirmation when uncertain`

Mistral is permitted only as a semantic food-understanding fallback. It may identify foods, meal structure, explicit components, preparation, quantities and modifiers. Nutrition always comes from trusted Keto Mentor `Food` and `FoodNutrient` records.

## Phase 2 — Human quantities and clarification

Understand human quantities such as plate, bowl, ladle, small or large piece, half portion and handful. Use authoritative `FoodServing` records where available. Controlled AI estimation may later be used when a quantity has no trusted weight conversion. Ask only the minimum useful clarification questions.

Implementation scope: exact mass remains deterministic; authoritative, curated and estimated servings are resolved in that order. A resolved food with an unsupported human unit may receive a bounded edible-weight estimate. Every estimated value requires explicit confirmation or a meal-only gram correction, and provider failures fall back to manual grams. Quantity AI cannot supply nutrition or mutate the global catalog.

## Phase 3 — Real meal diary

Add meal history, previous dates, meal details, editing, deletion, quick repeat/re-log and a better day/week overview.

## Phase 4 — Complete recipe experience

Complete manual recipes and add URL recipe import. Prefer schema.org JSON-LD, with Mistral fallback only when structured recipe data is unavailable. Recipe ingredients must always resolve through trusted `Food` records.

## Phase 5 — Packaged food and barcode

Add Open Food Facts, barcode scanning and packaged-product lookup with safe persistence, deduplication and provenance.

**Increment 1 (done):** data pipeline foundation — GTIN barcode validation, local-first resolution (never calls Open Food Facts once a barcode is trusted locally), a bounded Open Food Facts adapter with strict nutrient mapping and physical-plausibility checks, and manual barcode entry in the web UI that reuses the existing confirm-by-re-fetch trust architecture so browser-supplied nutrition is never persisted directly.

**Increment 2 (done):** camera barcode scanning as progressive enhancement ahead of the same pipeline — native `BarcodeDetector` where actually supported, a dynamically-imported `@zxing/browser` fallback everywhere else, camera permission requested only on explicit "Scan with camera", no frame/image ever leaves the browser, and manual entry remains available in every state (denied, no camera, unsupported browser, decoder failure).

Phase 5 is complete: packaged food, Open Food Facts, barcode validation, local-first lookup, safe external lookup with confirmation, safe persistence, deduplication, provenance, normal Food/meal integration, manual entry, and camera scanning with a manual fallback are all shipped.

## Phase 6 — Mobile product

Before investing in a native client, validate the product through real daily use of an installed, mobile-first PWA. Split into two sub-phases so the strategy shift is explicit rather than implied.

### Phase 6A — Installable PWA + real-user validation (done)

Turned the existing `apps/web` into a production-quality, installable, mobile-first PWA — not a second frontend, not a prototype. Delivered: a fixed foundational gap (production had no `<head>`/viewport meta at all, so no prior mobile CSS ever actually activated on a phone), `vite-plugin-pwa` with a manifest and icon set generated from the existing NorbApp brand mark, iOS home-screen metadata and safe-area support, a mobile bottom nav (Today/Log/Recipes) composed over the existing single-page structure, touch-target and iOS-zoom fixes, a non-nagging install affordance, a user-triggered update banner, and an offline-state banner — all with the authenticated API kept strictly network-only (no service-worker caching of auth/meals/recipes/food/barcode).

The owner is expected to install and use this on his own iPhone in daily life before Phase 6B is scoped.

**Owner beta hardening pass (done):** after real iPhone usage surfaced real product failures (multi-food Hungarian input silently garbled, the quantity AI fallback never actually rescuing a resolved food's missing conversion, an untranslated preparation value, a misleading recipe-import error, and a redundant DB round-trip on every login), each was root-caused and fixed at the architecture level — see git history for `fix: harden Keto Mentor from owner beta feedback`. One item could not be fixed from code: `render.yaml` declares no `FOOD_AI_PROVIDER`/`OPENROUTER_API_KEY`/`FOOD_AI_MODEL` at all, and this is the most likely shared root cause behind several of the AI-fallback symptoms — needs verification/configuration directly in the Render dashboard. Owner beta remains **active**: the owner must retest the repaired flows on the real iPhone before Phase 6A is considered fully validated.

### Phase 6B — Native Android + iOS (not started)

Prefer one shared mobile-client architecture, likely React Native with Expo unless repository analysis demonstrates a materially better choice. The initial client covers authentication, onboarding, dashboard, natural meal input, meal history, recipes and barcode scanning. Begins only after real-world PWA usage has validated the product workflows — not automatically after Phase 6A.

## Phase 7 — Beta and public release

Focus on real daily usage, bug fixing and UX polish. Complete password reset/email, privacy and terms, source attribution, monitoring, end-to-end coverage, store builds, closed beta and public launch.

## Delivery principles

- Expected launch window: 6–8 weeks at approximately 2–3 development hours per day.
- A phase may not expand indefinitely.
- If deterministic NLP becomes exception-driven after roughly 2–3 working sessions, prefer the AI fallback instead of hundreds of language rules.
- Infrastructure or security work may interrupt the roadmap only for a genuine blocker.
- New feature ideas belong in the backlog and do not automatically change the current phase.
- Phase-order changes require explicit product-owner approval.
- Premium coach, weekly meal plans and shopping lists are post-MVP unless explicitly promoted later.

## Backlog

The backlog collects useful ideas and technical debt without changing the locked delivery order. `NEXT_STEPS.md` remains supporting historical context for this section.
