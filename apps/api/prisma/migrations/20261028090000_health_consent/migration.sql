-- Explicit consent to health data (GDPR Art. 9), owner 2026-10-28.
-- Add-only, nullable, explicitly qualified.
ALTER TABLE "ketomentor"."User" ADD COLUMN "healthConsentAt" TIMESTAMP(3);
