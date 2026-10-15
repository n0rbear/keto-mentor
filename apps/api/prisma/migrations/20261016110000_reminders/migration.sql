-- Emlékeztetők (premium, owner-approved 2026-10-15): per-user reminder
-- settings. Add-only, nullable, explicitly qualified.
ALTER TABLE "ketomentor"."Profile" ADD COLUMN "reminders" JSONB;
