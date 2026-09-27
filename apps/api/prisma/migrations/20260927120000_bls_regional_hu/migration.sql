-- Regional database phase 2 (Hungary, 2026-09-27): official BLS 4.0 records
-- the Hungarian reference dishes need that were not in the production catalog.
-- The list and the curated names live in data/reference-dishes/bls-imports.json;
-- regenerate with
--   cd apps/api && npx tsx src/importers/bls-migration-sql.ts <BLS_4_0_Daten_2025_DE.xlsx> \
--     ../../data/reference-dishes/bls-imports.json prisma/migrations/20260927120000_bls_regional_hu/migration.sql \
--     reviewed_migration_regional_hu
-- Source: BLS_4_0_Daten_2025_DE.xlsx (blsdb.de, CC BY 4.0, Max Rubner-Institut
-- 2025) through the repo's own BlsAdapter, so values, the total-carbohydrate
-- conversion (CHO + FIBT) and the provenance match a regular import.
-- Inserts only (ON CONFLICT DO NOTHING); user data is never touched.

-- BEGIN GENERATED (bls-migration-sql.ts)

-- U672700 Schwein Vordereisbein/Vorderhaxe, Kochpökelware, geräuchert: 150 kcal, P 18.68, F 8.17, carbs(total) 0.437, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U672700', 'Schwein Vordereisbein/Vorderhaxe, Kochpökelware, geräuchert', '{"de":"Schwein Vordereisbein/Vorderhaxe, Kochpökelware, geräuchert","hu":"füstölt sertéscsülök","en":"smoked pork hock"}'::jsonb, '{"hu":["füstölt csülök","sertéscsülök füstölt"],"de":["Eisbein geräuchert","Schweinshaxe geräuchert","Surhaxe geräuchert"],"en":["smoked ham hock","smoked pork knuckle"]}'::jsonb, 'bls', 'U672700', 'Schwein Vordereisbein/Vorderhaxe, Kochpökelware, geräuchert', 'Oils and fats', 'schwein vordereisbein vorderhaxe kochpokelware gerauchert schwein vordereisbein vorderhaxe kochpokelware gerauchert de schwein vordereisbein vorderhaxe kochpokelware gerauchert hu fustolt sertescsulok en smoked pork hock hu fustolt csulok sertescsulok fustolt de eisbein gerauchert schweinshaxe gerauchert surhaxe gerauchert en smoked ham hock smoked pork knuckle', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 150, 8.17, 18.68, 0.437, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-de-schwein_vordereisbein_vorderhaxe_kochpokelware_gerauchert', f."id", 'Schwein Vordereisbein/Vorderhaxe, Kochpökelware, geräuchert', 'schwein vordereisbein vorderhaxe kochpokelware gerauchert', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-hu-fustolt_sertescsulok', f."id", 'füstölt sertéscsülök', 'fustolt sertescsulok', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-en-smoked_pork_hock', f."id", 'smoked pork hock', 'smoked pork hock', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-hu-fustolt_csulok', f."id", 'füstölt csülök', 'fustolt csulok', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-hu-sertescsulok_fustolt', f."id", 'sertéscsülök füstölt', 'sertescsulok fustolt', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-de-eisbein_gerauchert', f."id", 'Eisbein geräuchert', 'eisbein gerauchert', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-de-schweinshaxe_gerauchert', f."id", 'Schweinshaxe geräuchert', 'schweinshaxe gerauchert', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-de-surhaxe_gerauchert', f."id", 'Surhaxe geräuchert', 'surhaxe gerauchert', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-en-smoked_ham_hock', f."id", 'smoked ham hock', 'smoked ham hock', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672700-en-smoked_pork_knuckle', f."id", 'smoked pork knuckle', 'smoked pork knuckle', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"U672700","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672700'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.437 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0638 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 150 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.007 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.648 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 74.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7092 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 166.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 18.68 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.588 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 700 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.437 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.136 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.302 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.3409 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672700' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- V434100 Suppenhuhn Fleisch, mit Haut, roh: 257 kcal, P 18.5, F 20.3, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-V434100', 'Suppenhuhn Fleisch, mit Haut, roh', '{"de":"Suppenhuhn Fleisch, mit Haut, roh","hu":"tyúkhús (bőrrel)","en":"stewing hen meat with skin"}'::jsonb, '{}'::jsonb, 'bls', 'V434100', 'Suppenhuhn Fleisch, mit Haut, roh', 'BLS group V', 'suppenhuhn fleisch mit haut roh suppenhuhn fleisch mit haut roh de suppenhuhn fleisch mit haut roh hu tyukhus borrel en stewing hen meat with skin', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 257, 20.3, 18.5, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V434100-de-suppenhuhn_fleisch_mit_haut_roh', f."id", 'Suppenhuhn Fleisch, mit Haut, roh', 'suppenhuhn fleisch mit haut roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V434100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V434100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V434100-hu-tyukhus_borrel', f."id", 'tyúkhús (bőrrel)', 'tyukhus borrel', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V434100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V434100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V434100-en-stewing_hen_meat_with_skin', f."id", 'stewing hen meat with skin', 'stewing hen meat with skin', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V434100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V434100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.057 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 257 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.022 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.56 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 180 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.56 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 180 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 18.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 64.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 36 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.84 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8545 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.83 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V434100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- G343100 Wirsing roh: 37 kcal, P 2.779, F 0.32, carbs(total) 6.9, fiber 2.8

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-G343100', 'Wirsing roh', '{"de":"Wirsing roh","hu":"kelkáposzta","en":"savoy cabbage"}'::jsonb, '{}'::jsonb, 'bls', 'G343100', 'Wirsing roh', 'Vegetables', 'wirsing roh wirsing roh de wirsing roh hu kelkaposzta en savoy cabbage', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 37, 0.32, 2.779, 6.9, 2.8)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G343100-de-wirsing_roh', f."id", 'Wirsing roh', 'wirsing roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G343100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G343100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G343100-hu-kelkaposzta', f."id", 'kelkáposzta', 'kelkaposzta', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G343100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G343100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G343100-en-savoy_cabbage', f."id", 'savoy cabbage', 'savoy cabbage', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G343100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G343100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 64.222 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.048 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 37 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.55 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.009 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 55.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.192 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 236 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.779 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.057 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.32 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.059 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.064 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.331 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.21 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.156 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 163 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 50.735 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 68.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G343100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- W511000 Kasseler Kamm, Kochpökelware, geräuchert: 154 kcal, P 20.9, F 7.5, carbs(total) 0.611, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-W511000', 'Kasseler Kamm, Kochpökelware, geräuchert', '{"de":"Kasseler Kamm, Kochpökelware, geräuchert","hu":"füstölt tarja","en":"smoked cured pork neck"}'::jsonb, '{}'::jsonb, 'bls', 'W511000', 'Kasseler Kamm, Kochpökelware, geräuchert', 'BLS group W', 'kasseler kamm kochpokelware gerauchert kasseler kamm kochpokelware gerauchert de kasseler kamm kochpokelware gerauchert hu fustolt tarja en smoked cured pork neck', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 154, 7.5, 20.9, 0.611, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W511000-de-kasseler_kamm_kochpokelware_gerauchert', f."id", 'Kasseler Kamm, Kochpökelware, geräuchert', 'kasseler kamm kochpokelware gerauchert', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W511000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W511000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W511000-hu-fustolt_tarja', f."id", 'füstölt tarja', 'fustolt tarja', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W511000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W511000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-W511000-en-smoked_cured_pork_neck', f."id", 'smoked cured pork neck', 'smoked cured pork neck', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"W511000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'W511000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.611 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0859 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 154 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 14.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.011 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.756 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 160 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.672 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 324 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.166 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 700 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.611 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.35 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.21 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.41 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.498 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.86 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.1847 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'W511000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- G760400 Erbse reif: 311 kcal, P 23.023, F 1.44, carbs(total) 62.53, fiber 22.03

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-G760400', 'Erbse reif', '{"de":"Erbse reif","hu":"sárgaborsó (száraz)","en":"dry yellow split peas"}'::jsonb, '{}'::jsonb, 'bls', 'G760400', 'Erbse reif', 'Vegetables', 'erbse reif erbse reif de erbse reif hu sargaborso szaraz en dry yellow split peas', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 311, 1.44, 23.023, 62.53, 22.03)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G760400-de-erbse_reif', f."id", 'Erbse reif', 'erbse reif', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G760400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G760400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G760400-hu-sargaborso_szaraz', f."id", 'sárgaborsó (száraz)', 'sargaborso szaraz', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G760400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G760400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G760400-en-dry_yellow_split_peas', f."id", 'dry yellow split peas', 'dry yellow split peas', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G760400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G760400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 59 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 62.53 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.642 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 311 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 22.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.624 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 63 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.129 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 313 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 987 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.023 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 24 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.44 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.274 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.67 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.986 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11800000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 170 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.808 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G760400' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- R122000 Branntweinessig: 25 kcal, P 0, F 0, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-R122000', 'Branntweinessig', '{"de":"Branntweinessig","hu":"ecet (10%-os)","en":"spirit vinegar"}'::jsonb, '{}'::jsonb, 'bls', 'R122000', 'Branntweinessig', 'Meat', 'branntweinessig branntweinessig de branntweinessig hu ecet 10 os en spirit vinegar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 25, 0, 0, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R122000-de-branntweinessig', f."id", 'Branntweinessig', 'branntweinessig', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R122000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R122000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R122000-hu-ecet_10_os', f."id", 'ecet (10%-os)', 'ecet 10 os', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R122000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R122000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R122000-en-spirit_vinegar', f."id", 'spirit vinegar', 'spirit vinegar', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R122000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R122000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.006 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.055 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 161 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 83 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.74 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R122000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- M173800 Schlagsahne mind. 30 % Fett: 308 kcal, P 2.312, F 31.7, carbs(total) 3.27, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-M173800', 'Schlagsahne mind. 30 % Fett', '{"de":"Schlagsahne mind. 30 % Fett","hu":"habtejszín (30%)","en":"whipping cream 30%"}'::jsonb, '{}'::jsonb, 'bls', 'M173800', 'Schlagsahne mind. 30 % Fett', 'Dairy', 'schlagsahne mind 30 fett schlagsahne mind 30 fett de schlagsahne mind 30 fett hu habtejszin 30 en whipping cream 30', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 308, 31.7, 2.312, 3.27, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M173800-de-schlagsahne_mind_30_fett', f."id", 'Schlagsahne mind. 30 % Fett', 'schlagsahne mind 30 fett', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M173800","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M173800'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M173800-hu-habtejszin_30', f."id", 'habtejszín (30%)', 'habtejszin 30', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M173800","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M173800'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M173800-en-whipping_cream_30', f."id", 'whipping cream 30%', 'whipping cream 30', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M173800","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M173800'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 80 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.006 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 308 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.279 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 63 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.795 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 112 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.312 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 31.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 334 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.025 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.017 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.094 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.71 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M173800' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- F212100 Sauerkirsche roh: 69 kcal, P 0.9, F 0.5, carbs(total) 14.846, fiber 1.1

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-F212100', 'Sauerkirsche roh', '{"de":"Sauerkirsche roh","hu":"meggy","en":"sour cherry"}'::jsonb, '{}'::jsonb, 'bls', 'F212100', 'Sauerkirsche roh', 'Fruit', 'sauerkirsche roh sauerkirsche roh de sauerkirsche roh hu meggy en sour cherry', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 69, 0.5, 0.9, 14.846, 1.1)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F212100-de-sauerkirsche_roh', f."id", 'Sauerkirsche roh', 'sauerkirsche roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F212100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F212100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F212100-hu-meggy', f."id", 'meggy', 'meggy', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F212100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F212100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F212100-en-sour_cherry', f."id", 'sour cherry', 'sour cherry', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F212100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F212100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 14.846 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0777 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 69 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7623 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0614 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.137 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 124.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.746 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 47 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.045 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 74.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.13 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.091 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F212100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- F120100 Apfel geschält, roh: 43 kcal, P 0.3, F 0.13, carbs(total) 11.09, fiber 2.19

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-F120100', 'Apfel geschält, roh', '{"de":"Apfel geschält, roh","hu":"alma (hámozva)","en":"apple, peeled"}'::jsonb, '{}'::jsonb, 'bls', 'F120100', 'Apfel geschält, roh', 'Fruit', 'apfel geschalt roh apfel geschalt roh de apfel geschalt roh hu alma hamozva en apple peeled', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 43, 0.13, 0.3, 11.09, 2.19)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F120100-de-apfel_geschalt_roh', f."id", 'Apfel geschält, roh', 'apfel geschalt roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F120100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F120100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F120100-hu-alma_hamozva', f."id", 'alma (hámozva)', 'alma hamozva', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F120100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F120100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F120100-en-apple_peeled', f."id", 'apple, peeled', 'apple peeled', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F120100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F120100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 110 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.019 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.13 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.011 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.009 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.071 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.043000000000000003 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.115 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F120100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- S114000 Vanillezucker: 400 kcal, P 0, F 0, carbs(total) 100, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-S114000', 'Vanillezucker', '{"de":"Vanillezucker","hu":"vaníliás cukor","en":"vanilla sugar"}'::jsonb, '{}'::jsonb, 'bls', 'S114000', 'Vanillezucker', 'Poultry', 'vanillezucker vanillezucker de vanillezucker hu vanilias cukor en vanilla sugar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 400, 0, 0, 100, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S114000-de-vanillezucker', f."id", 'Vanillezucker', 'vanillezucker', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S114000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S114000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S114000-hu-vanilias_cukor', f."id", 'vaníliás cukor', 'vanilias cukor', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S114000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S114000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S114000-en-vanilla_sugar', f."id", 'vanilla sugar', 'vanilla sugar', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S114000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S114000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 100 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 400 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 100 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S114000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;
