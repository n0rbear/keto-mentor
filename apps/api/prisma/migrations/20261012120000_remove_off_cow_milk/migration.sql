-- Remove the Open Food Facts "cow milk" record (owner-approved 2026-10-12).
-- On 2026-10-12 a bare "tehén tej" found no local milk (the BLS/USDA milk
-- records had no Hungarian name), so the user picked OFF 8904089919135
-- "cow milk" (an Indian packaged product) from name-search results and it
-- was persisted as a GLOBAL Food named "tehéntej". The catalog's own milk
-- records get their Hungarian names in 20261012130000_staple_catalog_names.
--
-- Scope: exactly this one record, by (source, sourceId), global only
-- (createdById NULL), plus its own FoodAlias / FoodNutrient / FoodServing
-- rows. Read-only check before writing this: 0 MealItem, 0 RecipeIngredient,
-- 2 FoodAlias, 5 FoodNutrient, 0 FoodServing rows.
-- Guard: MealItem and RecipeIngredient are the only tables whose foreign key
-- to Food restricts deletes (FoodAlias, FoodServing and FoodNutrient
-- cascade). If anything references the record at deploy time, every
-- statement below matches nothing and the record stays. A database without
-- the record is a no-op too.

DELETE FROM "ketomentor"."FoodAlias" AS a
USING "ketomentor"."Food" AS f
WHERE a."foodId" = f."id"
  AND f."source" = 'open_food_facts' AND f."sourceId" = '8904089919135' AND f."createdById" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."MealItem" AS m WHERE m."foodId" = f."id")
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."RecipeIngredient" AS r WHERE r."foodId" = f."id");

DELETE FROM "ketomentor"."FoodNutrient" AS n
USING "ketomentor"."Food" AS f
WHERE n."foodId" = f."id"
  AND f."source" = 'open_food_facts' AND f."sourceId" = '8904089919135' AND f."createdById" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."MealItem" AS m WHERE m."foodId" = f."id")
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."RecipeIngredient" AS r WHERE r."foodId" = f."id");

DELETE FROM "ketomentor"."FoodServing" AS s
USING "ketomentor"."Food" AS f
WHERE s."foodId" = f."id"
  AND f."source" = 'open_food_facts' AND f."sourceId" = '8904089919135' AND f."createdById" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."MealItem" AS m WHERE m."foodId" = f."id")
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."RecipeIngredient" AS r WHERE r."foodId" = f."id");

DELETE FROM "ketomentor"."Food" AS f
WHERE f."source" = 'open_food_facts' AND f."sourceId" = '8904089919135' AND f."createdById" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."MealItem" AS m WHERE m."foodId" = f."id")
  AND NOT EXISTS (SELECT 1 FROM "ketomentor"."RecipeIngredient" AS r WHERE r."foodId" = f."id");
