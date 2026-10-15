-- Testsúlynapló (premium "Haladó statisztika", owner-approved 2026-10-15).
-- Create-only, explicitly qualified to the Keto Mentor schema.

CREATE TABLE "ketomentor"."WeightEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WeightEntry_userId_date_key" ON "ketomentor"."WeightEntry"("userId", "date");
ALTER TABLE "ketomentor"."WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
