-- Meal type (owner decision 2026-10-15): which meal a logged meal is.
-- Two nullable columns; existing meals keep NULL (shown without a type).
ALTER TABLE "ketomentor"."Meal" ADD COLUMN "mealType" TEXT;
ALTER TABLE "ketomentor"."Meal" ADD COLUMN "mealTypeLabel" TEXT;
