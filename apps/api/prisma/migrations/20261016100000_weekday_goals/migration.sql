-- Rugalmas célok (premium, owner-approved 2026-10-15): optional per-weekday
-- goal overrides. Add-only, nullable, explicitly qualified.
ALTER TABLE "ketomentor"."Profile" ADD COLUMN "weekdayGoals" JSONB;
