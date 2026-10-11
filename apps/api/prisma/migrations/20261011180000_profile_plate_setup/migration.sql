-- Plate onboarding (owner decision 2026-10-11): one additive, nullable
-- column; NULL = never answered. No data rewrite.
ALTER TABLE "Profile" ADD COLUMN "plateSetup" TEXT;
