-- Cold dinners (owner list of 150 cold dinner ideas, 2026-10-20): official
-- BLS 4.0 records those dishes need that no earlier migration ships.
-- The list and the curated names live in data/reference-dishes/bls-imports-cold.json;
-- regenerate with
--   cd apps/api && npx tsx src/importers/bls-migration-sql.ts <BLS_4_0_Daten_2025_DE.xlsx> \
--     ../../data/reference-dishes/bls-imports-cold.json prisma/migrations/20261020120000_bls_cold_dinners/migration.sql \
--     reviewed_migration_cold_dinners
-- Source: BLS_4_0_Daten_2025_DE.xlsx (blsdb.de, CC BY 4.0, Max Rubner-Institut
-- 2025) through the repo's own BlsAdapter, so values, the total-carbohydrate
-- conversion (CHO + FIBT) and the provenance match a regular import.
-- Inserts only (ON CONFLICT DO NOTHING); user data is never touched. A record
-- that already exists in production is left as it is.

-- BEGIN GENERATED (bls-migration-sql.ts)

-- W561000 Putenbrust, Kochpökelware, geräuchert: 107 kcal, P 23.02, F 1.63, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-W561000', 'Putenbrust, Kochpökelware, geräuchert', '{"de":"Putenbrust, Kochpökelware, geräuchert","hu":"pulykasonka (füstölt pulykamell)","en":"smoked turkey breast (turkey ham)"}'::jsonb, '{"hu":["pulykasonka","pulykamellsonka","füstölt pulykamell"],"de":["putenschinken","putenbrust aufschnitt"],"en":["turkey ham","deli turkey"]}'::jsonb, 'bls', 'W561000', 'Putenbrust, Kochpökelware, geräuchert', 'BLS group W', 'putenbrust kochpokelware gerauchert putenbrust kochpokelware gerauchert de putenbrust kochpokelware gerauchert hu pulykasonka fustolt pulykamell en smoked turkey breast turkey ham hu pulykasonka pulykamellsonka fustolt pulykamell de putenschinken putenbrust aufschnitt en turkey ham deli turkey', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 107, 1.63, 23.02, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-de-putenbrust_kochpokelware_gerauchert', f."id", 'Putenbrust, Kochpökelware, geräuchert', 'putenbrust kochpokelware gerauchert', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-hu-pulykasonka_fustolt_pulykamell', f."id", 'pulykasonka (füstölt pulykamell)', 'pulykasonka fustolt pulykamell', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-en-smoked_turkey_breast_turkey_ham', f."id", 'smoked turkey breast (turkey ham)', 'smoked turkey breast turkey ham', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-hu-pulykasonka', f."id", 'pulykasonka', 'pulykasonka', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-hu-pulykamellsonka', f."id", 'pulykamellsonka', 'pulykamellsonka', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-hu-fustolt_pulykamell', f."id", 'füstölt pulykamell', 'fustolt pulykamell', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-de-putenschinken', f."id", 'putenschinken', 'putenschinken', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-de-putenbrust_aufschnitt', f."id", 'putenbrust aufschnitt', 'putenbrust aufschnitt', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-en-turkey_ham', f."id", 'turkey ham', 'turkey ham', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W561000-en-deli_turkey', f."id", 'deli turkey', 'deli turkey', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"W561000","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W561000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 107 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.44 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.599 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 300 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5445 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 428 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.503 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1220 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.63 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.46 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.59 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.35 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 35.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.65 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.997 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W561000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- T410600 Lachs geräuchert (Räucherlachs): 170 kcal, P 21.25, F 9.2, carbs(total) 0.16, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-T410600', 'Lachs geräuchert (Räucherlachs)', '{"de":"Lachs geräuchert (Räucherlachs)","hu":"füstölt lazac","en":"smoked salmon"}'::jsonb, '{"hu":["füstölt lazac","lazac füstölt"],"de":["räucherlachs"],"en":["smoked salmon","lox"]}'::jsonb, 'bls', 'T410600', 'Lachs geräuchert (Räucherlachs)', 'BLS group T', 'lachs gerauchert raucherlachs lachs gerauchert raucherlachs de lachs gerauchert raucherlachs hu fustolt lazac en smoked salmon hu fustolt lazac lazac fustolt de raucherlachs en smoked salmon lox', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 170, 9.2, 21.25, 0.16, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T410600-de-lachs_gerauchert_raucherlachs', f."id", 'Lachs geräuchert (Räucherlachs)', 'lachs gerauchert raucherlachs', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T410600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T410600-hu-fustolt_lazac', f."id", 'füstölt lazac', 'fustolt lazac', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T410600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T410600-en-smoked_salmon', f."id", 'smoked salmon', 'smoked salmon', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T410600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T410600-hu-lazac_fustolt', f."id", 'lazac füstölt', 'lazac fustolt', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T410600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T410600-de-raucherlachs', f."id", 'räucherlachs', 'raucherlachs', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T410600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T410600-en-lox', f."id", 'lox', 'lox', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T410600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0343 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 170 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.147 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 28.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03270000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 280 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 419 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 21.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.73 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1170 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.264 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.551 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.634 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.805 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.94 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.783 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T410600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- T422600 Forelle geräuchert: 137 kcal, P 21.2, F 5.52, carbs(total) 0.03, fiber 0.03

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-T422600', 'Forelle geräuchert', '{"de":"Forelle geräuchert","hu":"füstölt pisztráng","en":"smoked trout"}'::jsonb, '{"hu":["füstölt pisztráng"],"de":["räucherforelle"],"en":["smoked trout"]}'::jsonb, 'bls', 'T422600', 'Forelle geräuchert', 'BLS group T', 'forelle gerauchert forelle gerauchert de forelle gerauchert hu fustolt pisztrang en smoked trout hu fustolt pisztrang de raucherforelle en smoked trout', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 137, 5.52, 21.2, 0.03, 0.03)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T422600-de-forelle_gerauchert', f."id", 'Forelle geräuchert', 'forelle gerauchert', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T422600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T422600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T422600-hu-fustolt_pisztrang', f."id", 'füstölt pisztráng', 'fustolt pisztrang', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T422600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T422600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T422600-en-smoked_trout', f."id", 'smoked trout', 'smoked trout', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T422600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T422600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T422600-de-raucherforelle', f."id", 'räucherforelle', 'raucherforelle', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T422600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T422600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 14.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.042 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 137 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.275 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0076 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 369 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 21.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 839 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.091 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.052 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.203 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.305 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.14400000000000002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.565 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.275 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T422600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- T107600 Makrele geräuchert: 338 kcal, P 18.89, F 29.2, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-T107600', 'Makrele geräuchert', '{"de":"Makrele geräuchert","hu":"füstölt makréla","en":"smoked mackerel"}'::jsonb, '{"hu":["füstölt makréla"],"de":["räuchermakrele"],"en":["smoked mackerel"]}'::jsonb, 'bls', 'T107600', 'Makrele geräuchert', 'BLS group T', 'makrele gerauchert makrele gerauchert de makrele gerauchert hu fustolt makrela en smoked mackerel hu fustolt makrela de rauchermakrele en smoked mackerel', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 338, 29.2, 18.89, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T107600-de-makrele_gerauchert', f."id", 'Makrele geräuchert', 'makrele gerauchert', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T107600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T107600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T107600-hu-fustolt_makrela', f."id", 'füstölt makréla', 'fustolt makrela', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T107600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T107600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T107600-en-smoked_mackerel', f."id", 'smoked mackerel', 'smoked mackerel', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T107600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T107600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T107600-de-rauchermakrele', f."id", 'räuchermakrele', 'rauchermakrele', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T107600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T107600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 338 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 33.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.536 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 199 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.547 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 312 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 18.89 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.161 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 722 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 72.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.99 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.61 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.31 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.925 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.877 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.832 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T107600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- T105702 Sardine in Öl, Konserve, abgetropft: 222 kcal, P 24.1, F 13.9, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-T105702', 'Sardine in Öl, Konserve, abgetropft', '{"de":"Sardine in Öl, Konserve, abgetropft","hu":"szardínia olajban (konzerv, lecsepegtetve)","en":"sardines in oil, canned, drained"}'::jsonb, '{"hu":["szardínia","szardíniakonzerv","olajos szardínia"],"de":["sardinen in öl","ölsardinen"],"en":["sardines","canned sardines"]}'::jsonb, 'bls', 'T105702', 'Sardine in Öl, Konserve, abgetropft', 'BLS group T', 'sardine in ol konserve abgetropft sardine in ol konserve abgetropft de sardine in ol konserve abgetropft hu szardinia olajban konzerv lecsepegtetve en sardines in oil canned drained hu szardinia szardiniakonzerv olajos szardinia de sardinen in ol olsardinen en sardines canned sardines', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 222, 13.9, 24.1, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-de-sardine_in_ol_konserve_abgetropft', f."id", 'Sardine in Öl, Konserve, abgetropft', 'sardine in ol konserve abgetropft', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-hu-szardinia_olajban_konzerv_lecsepegtetve', f."id", 'szardínia olajban (konzerv, lecsepegtetve)', 'szardinia olajban konzerv lecsepegtetve', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-en-sardines_in_oil_canned_drained', f."id", 'sardines in oil, canned, drained', 'sardines in oil canned drained', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-hu-szardinia', f."id", 'szardínia', 'szardinia', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-hu-szardiniakonzerv', f."id", 'szardíniakonzerv', 'szardiniakonzerv', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-hu-olajos_szardinia', f."id", 'olajos szardínia', 'olajos szardinia', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-de-sardinen_in_ol', f."id", 'sardinen in öl', 'sardinen in ol', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-de-olsardinen', f."id", 'ölsardinen', 'olsardinen', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-en-sardines', f."id", 'sardines', 'sardines', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-T105702-en-canned_sardines', f."id", 'canned sardines', 'canned sardines', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"T105702","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'T105702'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 50 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 222 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 430 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.264 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 388 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 24.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 366 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 50 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.48 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.511 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.86 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.889 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'T105702' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- M7A1600 Frischkäse aus Ziegenmilch, Natur, mind. 45 % Fett i. Tr.: 230 kcal, P 17.94, F 16.42, carbs(total) 2.02, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-M7A1600', 'Frischkäse aus Ziegenmilch, Natur, mind. 45 % Fett i. Tr.', '{"de":"Frischkäse aus Ziegenmilch, Natur, mind. 45 % Fett i. Tr.","hu":"kecske-krémsajt","en":"fresh goat cheese"}'::jsonb, '{"hu":["kecskesajt","kecske krémsajt","friss kecskesajt"],"de":["ziegenfrischkäse","ziegenkäse"],"en":["goat cheese","chèvre"]}'::jsonb, 'bls', 'M7A1600', 'Frischkäse aus Ziegenmilch, Natur, mind. 45 % Fett i. Tr.', 'Dairy', 'frischkase aus ziegenmilch natur mind 45 fett i tr frischkase aus ziegenmilch natur mind 45 fett i tr de frischkase aus ziegenmilch natur mind 45 fett i tr hu kecske kremsajt en fresh goat cheese hu kecskesajt kecske kremsajt friss kecskesajt de ziegenfrischkase ziegenkase en goat cheese chevre', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 230, 16.42, 17.94, 2.02, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-de-frischkase_aus_ziegenmilch_natur_mind_45_fett_i_tr', f."id", 'Frischkäse aus Ziegenmilch, Natur, mind. 45 % Fett i. Tr.', 'frischkase aus ziegenmilch natur mind 45 fett i tr', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-hu-kecske_kremsajt', f."id", 'kecske-krémsajt', 'kecske kremsajt', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-en-fresh_goat_cheese', f."id", 'fresh goat cheese', 'fresh goat cheese', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-hu-kecskesajt', f."id", 'kecskesajt', 'kecskesajt', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-hu-friss_kecskesajt', f."id", 'friss kecskesajt', 'friss kecskesajt', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-de-ziegenfrischkase', f."id", 'ziegenfrischkäse', 'ziegenfrischkase', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-de-ziegenkase', f."id", 'ziegenkäse', 'ziegenkase', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-en-goat_cheese', f."id", 'goat cheese', 'goat cheese', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M7A1600-en-chevre', f."id", 'chèvre', 'chevre', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M7A1600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 148 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0405 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 230 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.095 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0115 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.235 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 150.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4454 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 104 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17.94 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.609 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 419.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.74 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 140 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.68 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.053 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.64 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M7A1600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- M601600 Brie mind. 45 % Fett i. Tr.: 264 kcal, P 21, F 19.82, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-M601600', 'Brie mind. 45 % Fett i. Tr.', '{"de":"Brie mind. 45 % Fett i. Tr.","hu":"brie sajt","en":"Brie cheese"}'::jsonb, '{"hu":["brie","brie sajt"],"de":["brie"],"en":["brie"]}'::jsonb, 'bls', 'M601600', 'Brie mind. 45 % Fett i. Tr.', 'Dairy', 'brie mind 45 fett i tr brie mind 45 fett i tr de brie mind 45 fett i tr hu brie sajt en brie cheese hu brie brie sajt de brie en brie', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 264, 19.82, 21, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M601600-de-brie_mind_45_fett_i_tr', f."id", 'Brie mind. 45 % Fett i. Tr.', 'brie mind 45 fett i tr', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M601600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M601600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M601600-hu-brie_sajt', f."id", 'brie sajt', 'brie sajt', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M601600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M601600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M601600-en-brie_cheese', f."id", 'Brie cheese', 'brie cheese', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M601600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M601600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M601600-hu-brie', f."id", 'brie', 'brie', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M601600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M601600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M601600-de-brie', f."id", 'brie', 'brie', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M601600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M601600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M601600-en-brie', f."id", 'brie', 'brie', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"M601600","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M601600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 350 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 264 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.95 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 381.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 150 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 21 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 700 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.82 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 251 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 38.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.44 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.48 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M601600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U681700 Schwein Rohschinken, mager, Rohpökelware, geräuchert: 138 kcal, P 28.45, F 2.02, carbs(total) 0.15, fiber 0.03

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U681700', 'Schwein Rohschinken, mager, Rohpökelware, geräuchert', '{"de":"Schwein Rohschinken, mager, Rohpökelware, geräuchert","hu":"nyers sonka (pácolt, füstölt, sovány)","en":"cured raw ham, lean"}'::jsonb, '{"hu":["nyers sonka","serrano sonka","serrano"],"de":["rohschinken","serranoschinken"],"en":["serrano ham","cured ham"]}'::jsonb, 'bls', 'U681700', 'Schwein Rohschinken, mager, Rohpökelware, geräuchert', 'Oils and fats', 'schwein rohschinken mager rohpokelware gerauchert schwein rohschinken mager rohpokelware gerauchert de schwein rohschinken mager rohpokelware gerauchert hu nyers sonka pacolt fustolt sovany en cured raw ham lean hu nyers sonka serrano sonka serrano de rohschinken serranoschinken en serrano ham cured ham', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 138, 2.02, 28.45, 0.15, 0.03)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-de-schwein_rohschinken_mager_rohpokelware_gerauchert', f."id", 'Schwein Rohschinken, mager, Rohpökelware, geräuchert', 'schwein rohschinken mager rohpokelware gerauchert', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-hu-nyers_sonka_pacolt_fustolt_sovany', f."id", 'nyers sonka (pácolt, füstölt, sovány)', 'nyers sonka pacolt fustolt sovany', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-en-cured_raw_ham_lean', f."id", 'cured raw ham, lean', 'cured raw ham lean', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-hu-nyers_sonka', f."id", 'nyers sonka', 'nyers sonka', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-hu-serrano_sonka', f."id", 'serrano sonka', 'serrano sonka', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-hu-serrano', f."id", 'serrano', 'serrano', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-de-rohschinken', f."id", 'rohschinken', 'rohschinken', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-de-serranoschinken', f."id", 'serranoschinken', 'serranoschinken', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-en-serrano_ham', f."id", 'serrano ham', 'serrano ham', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U681700-en-cured_ham', f."id", 'cured ham', 'cured ham', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U681700","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U681700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0843 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 138 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.998 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 35.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.016300000000000002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.945 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 289.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.192 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 564.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 28.45 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2220 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.942 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.309 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.213 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.151 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.568 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.381 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.94 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.62 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.71 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.82 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U681700' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- V416182 Hähnchen Brustfilet, gebraten ohne Fett (Pfanne): 137 kcal, P 30.79, F 1.59, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-V416182', 'Hähnchen Brustfilet, gebraten ohne Fett (Pfanne)', '{"de":"Hähnchen Brustfilet, gebraten ohne Fett (Pfanne)","hu":"sült csirkemell (zsiradék nélkül)","en":"chicken breast fillet, pan-fried without fat"}'::jsonb, '{"hu":["sült csirkemell","grillezett csirkemell"],"de":["hähnchenbrust gebraten"],"en":["cooked chicken breast","grilled chicken breast"]}'::jsonb, 'bls', 'V416182', 'Hähnchen Brustfilet, gebraten ohne Fett (Pfanne)', 'BLS group V', 'hahnchen brustfilet gebraten ohne fett pfanne hahnchen brustfilet gebraten ohne fett pfanne de hahnchen brustfilet gebraten ohne fett pfanne hu sult csirkemell zsiradek nelkul en chicken breast fillet pan fried without fat hu sult csirkemell grillezett csirkemell de hahnchenbrust gebraten en cooked chicken breast grilled chicken breast', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 137, 1.59, 30.79, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-de-hahnchen_brustfilet_gebraten_ohne_fett_pfanne', f."id", 'Hähnchen Brustfilet, gebraten ohne Fett (Pfanne)', 'hahnchen brustfilet gebraten ohne fett pfanne', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-hu-sult_csirkemell_zsiradek_nelkul', f."id", 'sült csirkemell (zsiradék nélkül)', 'sult csirkemell zsiradek nelkul', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-en-chicken_breast_fillet_pan_fried_without_fat', f."id", 'chicken breast fillet, pan-fried without fat', 'chicken breast fillet pan fried without fat', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-hu-sult_csirkemell', f."id", 'sült csirkemell', 'sult csirkemell', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-hu-grillezett_csirkemell', f."id", 'grillezett csirkemell', 'grillezett csirkemell', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-de-hahnchenbrust_gebraten', f."id", 'hähnchenbrust gebraten', 'hahnchenbrust gebraten', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-en-cooked_chicken_breast', f."id", 'cooked chicken breast', 'cooked chicken breast', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V416182-en-grilled_chicken_breast', f."id", 'grilled chicken breast', 'grilled chicken breast', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"V416182","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V416182'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0302 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 137 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7953 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 34.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0141 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.461 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 271 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.311 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 522.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 30.79 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.36 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 58.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.59 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15248 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.137 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.81 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.28700000000000003 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.703 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.59 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8419 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V416182' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- Y131132 Roastbeef gebraten im Ofen, ohne Sauce: 180 kcal, P 28.72, F 7.27, carbs(total) 0.03, fiber 0.01

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-Y131132', 'Roastbeef gebraten im Ofen, ohne Sauce', '{"de":"Roastbeef gebraten im Ofen, ohne Sauce","hu":"sült marhahús (roastbeef)","en":"roast beef, oven-roasted"}'::jsonb, '{"hu":["roastbeef","hideg marhasült","marhasült"],"de":["roastbeef"],"en":["roast beef"]}'::jsonb, 'bls', 'Y131132', 'Roastbeef gebraten im Ofen, ohne Sauce', 'BLS group Y', 'roastbeef gebraten im ofen ohne sauce roastbeef gebraten im ofen ohne sauce de roastbeef gebraten im ofen ohne sauce hu sult marhahus roastbeef en roast beef oven roasted hu roastbeef hideg marhasult marhasult de roastbeef en roast beef', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 180, 7.27, 28.72, 0.03, 0.01)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-de-roastbeef_gebraten_im_ofen_ohne_sauce', f."id", 'Roastbeef gebraten im Ofen, ohne Sauce', 'roastbeef gebraten im ofen ohne sauce', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-hu-sult_marhahus_roastbeef', f."id", 'sült marhahús (roastbeef)', 'sult marhahus roastbeef', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-en-roast_beef_oven_roasted', f."id", 'roast beef, oven-roasted', 'roast beef oven roasted', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-hu-roastbeef', f."id", 'roastbeef', 'roastbeef', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-hu-hideg_marhasult', f."id", 'hideg marhasült', 'hideg marhasult', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-hu-marhasult', f."id", 'marhasült', 'marhasult', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-de-roastbeef', f."id", 'roastbeef', 'roastbeef', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y131132-en-roast_beef', f."id", 'roast beef', 'roast beef', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y131132","via":"reviewed_migration_cold_dinners"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 180 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.661 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 26.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.77 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 178 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.55 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 380.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 28.72 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 224 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.066 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.65 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.203 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.898 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.374 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.333 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.373 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.44 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y131132' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;
