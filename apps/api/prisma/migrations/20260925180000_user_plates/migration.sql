-- Forward-only: the user's own measured plates for plate-photo portion
-- estimation (owner request, 2026-09-25). Only the outer diameter is kept;
-- photos are never stored. Explicitly qualified to the Keto Mentor schema.
CREATE TABLE "ketomentor"."UserPlate" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "diameterMm" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPlate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserPlate_userId_idx" ON "ketomentor"."UserPlate"("userId");

ALTER TABLE "ketomentor"."UserPlate" ADD CONSTRAINT "UserPlate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
