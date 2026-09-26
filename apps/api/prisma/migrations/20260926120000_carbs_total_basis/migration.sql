-- One carbohydrate convention (owner-approved 2026-09-26): Food.carbsPer100g
-- is TOTAL carbohydrate (fiber included) and net carbs = carbs - fiber.
-- BLS "CHO" and EU Open Food Facts labels store AVAILABLE carbohydrate
-- (fiber already excluded), so the app subtracted fiber twice for them.
-- Verified on the production catalog: BLS energy matches
-- 4*protein + 9*fat + 4*CHO + 2*fiber with a 0.1 % median error.
--
-- Converts those rows to total carbohydrate once. The provenance marker
-- makes the statements idempotent and matches what the importers now write,
-- so a later re-import cannot double-add fiber either.
-- Meal items that froze nutrition at logging time are corrected first
-- (owner-approved 2026-09-26, roadmap A1b), while the food rows still carry
-- the old values. Both blocks only look at foods WITHOUT the marker, so a
-- re-run corrects nothing twice.

-- Recipe meal items: the stored netCarbs was the sum of per-ingredient
-- max(0, CHO - fiber); the correct value is CHO, so the gap per ingredient
-- is min(fiber, CHO). The portion factor is the one used at logging time:
-- quantityGrams / (finishedWeightGrams, else the counted ingredient grams).
WITH recipe_fix AS (
  SELECT r."id" AS recipe_id,
         COALESCE(r."finishedWeightGrams", SUM(ri."quantityGrams")) AS base_grams,
         SUM(ri."quantityGrams" / 100.0 * LEAST(f."fiberPer100g", f."carbsPer100g"))
           FILTER (WHERE f."source" IN ('bls', 'open_food_facts') AND NOT (COALESCE(f."provenance", '{}'::jsonb) ? 'carbohydrateBasis')) AS net_gap,
         SUM(ri."quantityGrams" / 100.0 * f."fiberPer100g")
           FILTER (WHERE f."source" IN ('bls', 'open_food_facts') AND NOT (COALESCE(f."provenance", '{}'::jsonb) ? 'carbohydrateBasis')) AS carbs_gap
  FROM "ketomentor"."Recipe" AS r
  JOIN "ketomentor"."RecipeIngredient" AS ri ON ri."recipeId" = r."id"
  JOIN "ketomentor"."Food" AS f ON f."id" = ri."foodId"
  WHERE ri."includedInBaseNutrition" AND ri."quantityGrams" IS NOT NULL
  GROUP BY r."id", r."finishedWeightGrams"
)
UPDATE "ketomentor"."MealItem" AS mi
SET "snapshotNetCarbs" = mi."snapshotNetCarbs" + mi."quantityGrams" / rf.base_grams * rf.net_gap,
    "snapshotCarbs" = CASE WHEN mi."snapshotCarbs" IS NULL THEN NULL ELSE mi."snapshotCarbs" + mi."quantityGrams" / rf.base_grams * rf.carbs_gap END
FROM recipe_fix AS rf
WHERE mi."recipeId" = rf.recipe_id
  AND mi."snapshotNetCarbs" IS NOT NULL
  AND rf.base_grams > 0
  AND rf.net_gap > 0;

-- Plain food meal items with a frozen snapshot: net carbs are derived as
-- snapshotCarbs - snapshotFiber, so the frozen carbs gain the fiber.
UPDATE "ketomentor"."MealItem" AS mi
SET "snapshotCarbs" = mi."snapshotCarbs" + mi."quantityGrams" / 100.0 * f."fiberPer100g"
FROM "ketomentor"."Food" AS f
WHERE mi."foodId" = f."id"
  AND mi."snapshotCarbs" IS NOT NULL
  AND mi."snapshotNetCarbs" IS NULL
  AND f."fiberPer100g" > 0
  AND f."source" IN ('bls', 'open_food_facts')
  AND NOT (COALESCE(f."provenance", '{}'::jsonb) ? 'carbohydrateBasis');

UPDATE "ketomentor"."FoodNutrient" AS fn
SET "amountPer100g" = ROUND((f."carbsPer100g" + f."fiberPer100g")::numeric, 3)::double precision
FROM "ketomentor"."Food" AS f, "ketomentor"."Nutrient" AS n
WHERE fn."foodId" = f."id"
  AND fn."nutrientId" = n."id"
  AND n."key" = 'carbohydrate'
  AND f."source" IN ('bls', 'open_food_facts')
  AND NOT (COALESCE(f."provenance", '{}'::jsonb) ? 'carbohydrateBasis');

UPDATE "ketomentor"."Food"
SET "carbsPer100g" = ROUND(("carbsPer100g" + "fiberPer100g")::numeric, 3)::double precision,
    "provenance" = jsonb_set(COALESCE("provenance", '{}'::jsonb), '{carbohydrateBasis}', '"total_from_available_plus_fiber"')
WHERE "source" IN ('bls', 'open_food_facts')
  AND NOT (COALESCE("provenance", '{}'::jsonb) ? 'carbohydrateBasis');
