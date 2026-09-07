# Keto Mentor Product Roadmap — Locked Delivery Plan

This document is the authoritative product delivery order for Keto Mentor. Technical debt and feature ideas may support a phase, but they do not replace or reorder this plan without explicit product-owner approval.

## Status

| Phase | Status |
| --- | --- |
| Phase 1 — Understand what the user ate | DONE |
| Phase 2 — Human quantities and clarification | DONE |
| Phase 3 — Real meal diary | DONE |
| Phase 4 — Complete recipe experience | PARTIAL FOUNDATION |
| Phase 5 — Packaged food and barcode | NOT STARTED |
| Phase 6 — Android + iOS mobile app | NOT STARTED |
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

## Phase 6 — Android + iOS mobile app

Prefer one shared mobile-client architecture, likely React Native with Expo unless repository analysis demonstrates a materially better choice. The initial client covers authentication, onboarding, dashboard, natural meal input, meal history, recipes and barcode scanning.

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
