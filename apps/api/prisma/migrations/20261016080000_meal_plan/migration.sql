-- Heti étrendterv (premium, owner request 2026-10-15). Create-only,
-- explicitly qualified to the Keto Mentor schema.

CREATE TABLE "ketomentor"."MealPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "days" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MealPlan_userId_startDate_key" ON "ketomentor"."MealPlan"("userId", "startDate");
ALTER TABLE "ketomentor"."MealPlan" ADD CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
