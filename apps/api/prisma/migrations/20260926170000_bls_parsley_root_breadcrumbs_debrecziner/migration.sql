-- Roadmap A3 (owner-approved 2026-09-26): three official BLS 4.0 records the
-- reference dishes need were missing from the production catalog:
--   G670100 Wurzelpetersilie roh      -> petrezselyemgyökér (gulyásleves, marhahúsleves)
--   B821000 Paniermehl/Semmelbrösel   -> zsemlemorzsa (rántott hús)
--   W185000 Debrecziner roh           -> debreceni kolbász (Hungarian-style smoked
--                                        sausage for töltött káposzta, rakott krumpli)
-- Generated from BLS_4_0_Daten_2025_DE.xlsx (blsdb.de, CC BY 4.0, Max
-- Rubner-Institut 2025) through the repo's own BlsAdapter, so every value,
-- the total-carbohydrate conversion (CHO + FIBT) and the provenance match a
-- regular import. "fehérrépa" is the everyday Hungarian word for parsley
-- root (see 20260926130000). Inserts only; a no-op where the rows exist.

-- G670100 Wurzelpetersilie roh: 76 kcal, P 2.88, F 0.47, carbs(total) 15.93, fiber 2.13

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-G670100', 'Wurzelpetersilie roh', '{"de":"Wurzelpetersilie roh","hu":"petrezselyemgyökér","en":"parsley root"}'::jsonb, '{"hu":["petrezselyemgyökér","petrezselyem gyökér","fehérrépa"],"de":["Petersilienwurzel","Wurzelpetersilie"],"en":["parsley root"]}'::jsonb, 'bls', 'G670100', 'Wurzelpetersilie roh', 'Vegetables', 'wurzelpetersilie roh wurzelpetersilie roh de wurzelpetersilie roh hu petrezselyemgyoker en parsley root hu petrezselyemgyoker petrezselyem gyoker feherrepa de petersilienwurzel wurzelpetersilie en parsley root', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 76, 0.47, 2.88, 15.93, 2.13)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-de-wurzelpetersilie_roh', f."id", 'Wurzelpetersilie roh', 'wurzelpetersilie roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-hu-petrezselyemgyoker', f."id", 'petrezselyemgyökér', 'petrezselyemgyoker', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-en-parsley_root', f."id", 'parsley root', 'parsley root', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-hu-petrezselyem_gyoker', f."id", 'petrezselyem gyökér', 'petrezselyem gyoker', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-hu-feherrepa', f."id", 'fehérrépa', 'feherrepa', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-de-petersilienwurzel', f."id", 'Petersilienwurzel', 'petersilienwurzel', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G670100-de-wurzelpetersilie', f."id", 'Wurzelpetersilie', 'wurzelpetersilie', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"G670100","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G670100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 76 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.47 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 15.93 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.13 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.086 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 59 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 41 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 562 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 39 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 56.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.85 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.635 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.076 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0319 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.252 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G670100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- B821000 Paniermehl/Semmelbrösel/Semmelmehl: 364 kcal, P 11.6, F 3.97, carbs(total) 72.82, fiber 5.34

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-B821000', 'Paniermehl/Semmelbrösel/Semmelmehl', '{"de":"Paniermehl/Semmelbrösel/Semmelmehl","hu":"zsemlemorzsa","en":"breadcrumbs"}'::jsonb, '{"hu":["zsemlemorzsa","prézli"],"de":["Paniermehl","Semmelbrösel"],"en":["breadcrumbs","bread crumbs"]}'::jsonb, 'bls', 'B821000', 'Paniermehl/Semmelbrösel/Semmelmehl', 'Bread and baked goods', 'paniermehl semmelbrosel semmelmehl paniermehl semmelbrosel semmelmehl de paniermehl semmelbrosel semmelmehl hu zsemlemorzsa en breadcrumbs hu zsemlemorzsa prezli de paniermehl semmelbrosel en breadcrumbs bread crumbs', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 364, 3.97, 11.6, 72.82, 5.34)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-de-paniermehl_semmelbrosel_semmelmehl', f."id", 'Paniermehl/Semmelbrösel/Semmelmehl', 'paniermehl semmelbrosel semmelmehl', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-hu-zsemlemorzsa', f."id", 'zsemlemorzsa', 'zsemlemorzsa', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-en-breadcrumbs', f."id", 'breadcrumbs', 'breadcrumbs', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-hu-prezli', f."id", 'prézli', 'prezli', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-de-paniermehl', f."id", 'Paniermehl', 'paniermehl', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-de-semmelbrosel', f."id", 'Semmelbrösel', 'semmelbrosel', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-B821000-en-bread_crumbs', f."id", 'bread crumbs', 'bread crumbs', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"B821000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'B821000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 364 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.97 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 72.82 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.781 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.839 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.071 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.154 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.249 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.111 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.271 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.69 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.281 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 758.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 186.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 32 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 118.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.155 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.89 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1469 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7411000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.914 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.118 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.625 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'B821000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- W185000 Debrecziner roh: 330 kcal, P 23.32, F 26.31, carbs(total) 0.07, fiber 0.07

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-W185000', 'Debrecziner roh', '{"de":"Debrecziner roh","hu":"debreceni kolbász (nyers)","en":"Debrecziner sausage, raw"}'::jsonb, '{"hu":["debreceni","debreceni kolbász"],"de":["Debrecziner"],"en":["debrecziner"]}'::jsonb, 'bls', 'W185000', 'Debrecziner roh', 'BLS group W', 'debrecziner roh debrecziner roh de debrecziner roh hu debreceni kolbasz nyers en debrecziner sausage raw hu debreceni debreceni kolbasz de debrecziner en debrecziner', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 330, 26.31, 23.32, 0.07, 0.07)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-de-debrecziner_roh', f."id", 'Debrecziner roh', 'debrecziner roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-hu-debreceni_kolbasz_nyers', f."id", 'debreceni kolbász (nyers)', 'debreceni kolbasz nyers', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-en-debrecziner_sausage_raw', f."id", 'Debrecziner sausage, raw', 'debrecziner sausage raw', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-hu-debreceni', f."id", 'debreceni', 'debreceni', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-hu-debreceni_kolbasz', f."id", 'debreceni kolbász', 'debreceni kolbasz', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-de-debrecziner', f."id", 'Debrecziner', 'debrecziner', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W185000-en-debrecziner', f."id", 'debrecziner', 'debrecziner', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W185000","via":"reviewed_migration_A3"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W185000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 330 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.32 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 26.31 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.471 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.155 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.39 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.018 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1400 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 397 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 201 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.99 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07100000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.56 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.83 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W185000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;
