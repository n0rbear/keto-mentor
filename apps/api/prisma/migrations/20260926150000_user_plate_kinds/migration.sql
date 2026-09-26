-- Saját tányérok (roadmap D, owner-approved 2026-09-26): plates are measured
-- once by the user instead of estimated from a photo. A deep plate is
-- described by its capacity (ml, filled with water to the brim), a flat
-- plate by its diameter. Existing (photo-era) rows become flat plates with
-- their stored diameter; the user can edit or delete them.
ALTER TABLE "ketomentor"."UserPlate" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'flat';
ALTER TABLE "ketomentor"."UserPlate" ADD COLUMN "capacityMl" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."UserPlate" ALTER COLUMN "diameterMm" DROP NOT NULL;
ALTER TABLE "ketomentor"."UserPlate" ADD CONSTRAINT "UserPlate_kind_check" CHECK (
  ("kind" = 'deep' AND "capacityMl" IS NOT NULL AND "capacityMl" > 0)
  OR ("kind" = 'flat' AND "diameterMm" IS NOT NULL AND "diameterMm" > 0)
);
