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

### Free Premium / community contribution (product direction, not scoped)

Recorded 2026-09-15. Not scheduled; does not change Phase 6/6B order.

A future "Earn Premium" section should exist as one general, extensible reward system, not a pile of unrelated one-off features. Planned reward mechanisms: (A) contributing a genuinely missing food/product, (B) referral/invite reaching a real activation milestone (never merely generating or clicking a link), (C) further mechanisms added later without redesigning the entitlement system.

Product contribution flow: user photographs a packaged product; AI/vision may extract name/brand/barcode/nutrition/basis, but the AI extraction is never itself the evidence — the package label is. The user reviews/corrects before submitting. After submission, Keto Mentor checks existing sources (local DB, authoritative sources, Open Food Facts, other approved sources) to determine if the product is genuinely new; users are never told in advance which products are missing. One accepted genuinely-new product = one Premium day, uncapped at the architecture level unless abuse analysis later shows a cap is needed. Reward issuance must be transactional and idempotent — a qualifying contribution must never award Premium twice, including under duplicate submissions (same EAN/GTIN, same product from different accounts, or a race between simultaneous submissions).

Provenance principle: nutrition value and evidence/provenance are separate concepts, and original evidence must never be discarded just because a stronger source appears later. A future contribution needs to preserve enough to audit where a value came from (conceptually: product, nutrition evidence, submission, contributor, verification, reward — exact modeling TBD, reusing whatever trust vocabulary exists in the repo at the time rather than inventing a parallel one). Community-matching submissions increase confidence but are not automatically equal to an authoritative source; a label submission tied to a specific EAN/GTIN can be stronger evidence than freely-typed values. Products can be reformulated over time — architecture should allow multiple evidence entries/versions per product rather than assuming one EAN means one nutrition value forever, and must not destructively overwrite history (this also matters for already-logged meal snapshots).

Related, separate roadmap item: an AI nutrition fallback (trusted/local → authoritative external → AI estimate only as a last resort) is being considered for ingredients no catalog can resolve. Any such estimate must be explicitly marked as estimated, never authoritative, with the user able to accept it or enter real values — and a real package label always preferred over an AI estimate when the user has one.

Reward bookkeeping should eventually be a general append-only ledger (user, reward type, reason/source, amount/duration, status, qualifying evidence, issued timestamp, idempotency identity, reversal capability) rather than each new reward mechanism mutating a Premium expiry date directly, so new reward types (product contribution, referral, future campaigns) never require touching the entitlement model itself. User-facing reward history ("N Premium days earned", contribution stats) is a later UI concern.

Strategic intent: user hits a missing food → contributes real evidence → catalog gains coverage → user earns Premium → the next user gets an immediate resolution. The catalog should grow from legitimate real usage rather than requiring the developer to hand-build global coverage.

**Architecture compatibility check (2026-09-15):** an `Entitlement` model already exists (`User`-scoped, `plan`/`features[]`/`active`/`expiresAt`) but has zero application code referencing it yet — it's schema-only, so nothing currently depends on its exact shape. A future append-only reward ledger can be added as a new, separate model that computes/extends entitlement state additively, without needing to redesign `Entitlement` now. `Food` already carries a single `source` enum (includes `ai_ocr` and `user_input`), a single nullable `barcode`, and a single `provenance` Json field — sufficient for today's scope, but this is a single-value-per-row model: it does not preserve multiple independent evidence submissions or a confirmation history, which is exactly why the roadmap above expects a separate evidence/submission model later rather than extending `Food.provenance` in place. Historical nutrition immutability already works correctly today: `MealItem` stores frozen `snapshotKcal`/etc. fields, so a `Food`'s nutrition changing later never retroactively changes an already-logged meal — the roadmap's "don't destructively overwrite history" concern is already satisfied for logged meals specifically. No current or in-flight work (recipe/ingredient-resolution architecture, AI provider config) touches `Entitlement`, `Food.source`, or `Food.provenance` in any way that would make this harder later — no near-term schema decision is required.
