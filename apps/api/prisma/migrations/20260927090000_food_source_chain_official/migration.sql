-- Regional database brief (owner, 2026-09-27): fast-food chain products are
-- Food rows from the chain's official per-country nutrition table, kept
-- apart from curated datasets (bls, usda_fdc) and from Open Food Facts.
-- Enum value only; no table or column change. The rows themselves come from
-- the idempotent reference seed (apps/api/src/reference-dishes/seed.ts).
ALTER TYPE "FoodSource" ADD VALUE IF NOT EXISTS 'chain_official';
