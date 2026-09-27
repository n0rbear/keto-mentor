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

-- M713300 Speisequark Halbfettstufe, 20 % Fett i. Tr.: 110 kcal, P 12.245, F 5.1, carbs(total) 3.04, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-M713300', 'Speisequark Halbfettstufe, 20 % Fett i. Tr.', '{"de":"Speisequark Halbfettstufe, 20 % Fett i. Tr.","hu":"tehéntúró (félzsíros)","en":"quark / farmer cheese, 20% fat in dry matter"}'::jsonb, '{}'::jsonb, 'bls', 'M713300', 'Speisequark Halbfettstufe, 20 % Fett i. Tr.', 'Dairy', 'speisequark halbfettstufe 20 fett i tr speisequark halbfettstufe 20 fett i tr de speisequark halbfettstufe 20 fett i tr hu tehenturo felzsiros en quark farmer cheese 20 fat in dry matter', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 110, 5.1, 12.245, 3.04, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M713300-de-speisequark_halbfettstufe_20_fett_i_tr', f."id", 'Speisequark Halbfettstufe, 20 % Fett i. Tr.', 'speisequark halbfettstufe 20 fett i tr', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M713300","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M713300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M713300-hu-tehenturo_felzsiros', f."id", 'tehéntúró (félzsíros)', 'tehenturo felzsiros', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M713300","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M713300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M713300-en-quark_farmer_cheese_20_fat_in_dry_matter', f."id", 'quark / farmer cheese, 20% fat in dry matter', 'quark farmer cheese 20 fat in dry matter', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M713300","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M713300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 85 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.014 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 110 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.37 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.305 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 165 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.134 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.245 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.762 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 35 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.037 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.81 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.68 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.085 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713300' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- M713500 Speisequark Fettstufe, 40 % Fett i. Tr.: 159 kcal, P 10.874, F 11.4, carbs(total) 2.6, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-M713500', 'Speisequark Fettstufe, 40 % Fett i. Tr.', '{"de":"Speisequark Fettstufe, 40 % Fett i. Tr.","hu":"tehéntúró (zsíros)","en":"quark / farmer cheese, 40% fat in dry matter"}'::jsonb, '{}'::jsonb, 'bls', 'M713500', 'Speisequark Fettstufe, 40 % Fett i. Tr.', 'Dairy', 'speisequark fettstufe 40 fett i tr speisequark fettstufe 40 fett i tr de speisequark fettstufe 40 fett i tr hu tehenturo zsiros en quark farmer cheese 40 fat in dry matter', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 159, 11.4, 10.874, 2.6, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M713500-de-speisequark_fettstufe_40_fett_i_tr', f."id", 'Speisequark Fettstufe, 40 % Fett i. Tr.', 'speisequark fettstufe 40 fett i tr', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M713500","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M713500'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M713500-hu-tehenturo_zsiros', f."id", 'tehéntúró (zsíros)', 'tehenturo zsiros', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M713500","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M713500'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M713500-en-quark_farmer_cheese_40_fat_in_dry_matter', f."id", 'quark / farmer cheese, 40% fat in dry matter', 'quark farmer cheese 40 fat in dry matter', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M713500","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M713500'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 95 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.013000000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 159 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.912 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 187 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.298 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 82 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.874 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.173 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 94 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.033 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.72 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.24 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.61 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 28.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M713500' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- S111100 Puderzucker: 400 kcal, P 0, F 0, carbs(total) 100, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-S111100', 'Puderzucker', '{"de":"Puderzucker","hu":"porcukor","en":"powdered sugar"}'::jsonb, '{}'::jsonb, 'bls', 'S111100', 'Puderzucker', 'Poultry', 'puderzucker puderzucker de puderzucker hu porcukor en powdered sugar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 400, 0, 0, 100, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S111100-de-puderzucker', f."id", 'Puderzucker', 'puderzucker', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S111100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S111100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S111100-hu-porcukor', f."id", 'porcukor', 'porcukor', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S111100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S111100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S111100-en-powdered_sugar', f."id", 'powdered sugar', 'powdered sugar', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S111100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S111100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 100 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 400 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 100 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S111100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- H450400 Mohn gemahlen: 521 kcal, P 23.821, F 42.2, carbs(total) 20.149, fiber 17.159

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-H450400', 'Mohn gemahlen', '{"de":"Mohn gemahlen","hu":"darált mák","en":"ground poppy seed"}'::jsonb, '{}'::jsonb, 'bls', 'H450400', 'Mohn gemahlen', 'Legumes', 'mohn gemahlen mohn gemahlen de mohn gemahlen hu daralt mak en ground poppy seed', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 521, 42.2, 23.821, 20.149, 17.159)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-H450400-de-mohn_gemahlen', f."id", 'Mohn gemahlen', 'mohn gemahlen', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"H450400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'H450400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-H450400-hu-daralt_mak', f."id", 'darált mák', 'daralt mak', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"H450400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'H450400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-H450400-en-ground_poppy_seed', f."id", 'ground poppy seed', 'ground poppy seed', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"H450400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'H450400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1413 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.149 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.661 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 521 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17.159 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.46 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 340 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 854 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29.93 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 720 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.821 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 21 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.99 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 42.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.119 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.693 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.264 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.86 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H450400' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- H120400 Walnuss gemahlen: 718 kcal, P 16.07, F 70.6, carbs(total) 6.2, fiber 3.2

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-H120400', 'Walnuss gemahlen', '{"de":"Walnuss gemahlen","hu":"darált dió","en":"ground walnuts"}'::jsonb, '{}'::jsonb, 'bls', 'H120400', 'Walnuss gemahlen', 'Legumes', 'walnuss gemahlen walnuss gemahlen de walnuss gemahlen hu daralt dio en ground walnuts', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 718, 70.6, 16.07, 6.2, 3.2)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-H120400-de-walnuss_gemahlen', f."id", 'Walnuss gemahlen', 'walnuss gemahlen', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"H120400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'H120400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-H120400-hu-daralt_dio', f."id", 'darált dió', 'daralt dio', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"H120400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'H120400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-H120400-en-ground_walnuts', f."id", 'ground walnuts', 'ground walnuts', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"H120400","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'H120400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 87.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 718 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.158 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 140 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.74 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.653 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 320 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 51.648 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 444 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.516 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.68 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 70.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.091 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.847 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.36 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 33.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 36.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.025 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.32 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.426 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'H120400' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- C218000 Weichweizen Grieß: 355 kcal, P 10.72, F 0.88, carbs(total) 78.03, fiber 4.06

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-C218000', 'Weichweizen Grieß', '{"de":"Weichweizen Grieß","hu":"búzadara (gríz)","en":"wheat semolina (soft wheat)"}'::jsonb, '{}'::jsonb, 'bls', 'C218000', 'Weichweizen Grieß', 'Cereals', 'weichweizen griess weichweizen griess de weichweizen griess hu buzadara griz en wheat semolina soft wheat', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 355, 0.88, 10.72, 78.03, 4.06)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-C218000-de-weichweizen_griess', f."id", 'Weichweizen Grieß', 'weichweizen griess', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"C218000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'C218000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-C218000-hu-buzadara_griz', f."id", 'búzadara (gríz)', 'buzadara griz', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"C218000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'C218000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-C218000-en-wheat_semolina_soft_wheat', f."id", 'wheat semolina (soft wheat)', 'wheat semolina soft wheat', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"C218000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'C218000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 15.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 78.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09759999999999999 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 355 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.6069 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3857 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 73.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 124.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.72 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.76504 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.112 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.043 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.96 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.24 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.296 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4609 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'C218000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- F223100 Zwetschge roh: 48 kcal, P 0.3, F 0.17, carbs(total) 12.41, fiber 1.7

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-F223100', 'Zwetschge roh', '{"de":"Zwetschge roh","hu":"szilva (magozott)","en":"plum (Zwetschge), raw"}'::jsonb, '{}'::jsonb, 'bls', 'F223100', 'Zwetschge roh', 'Fruit', 'zwetschge roh zwetschge roh de zwetschge roh hu szilva magozott en plum zwetschge raw', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 48, 0.17, 0.3, 12.41, 1.7)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F223100-de-zwetschge_roh', f."id", 'Zwetschge roh', 'zwetschge roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F223100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F223100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F223100-hu-szilva_magozott', f."id", 'szilva (magozott)', 'szilva magozott', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F223100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F223100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F223100-en-plum_zwetschge_raw', f."id", 'plum (Zwetschge), raw', 'plum zwetschge raw', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F223100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F223100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.41 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.065 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 48 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.052 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.078 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 172 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.022 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.044 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.045 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.583 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.045 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.283 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F223100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- S132000 Konfitüre extra: 234 kcal, P 0.4, F 0.2, carbs(total) 57.4, fiber 1.1

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-S132000', 'Konfitüre extra', '{"de":"Konfitüre extra","hu":"lekvár (sárgabarack, szilva)","en":"jam"}'::jsonb, '{}'::jsonb, 'bls', 'S132000', 'Konfitüre extra', 'Poultry', 'konfiture extra konfiture extra de konfiture extra hu lekvar sargabarack szilva en jam', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 234, 0.2, 0.4, 57.4, 1.1)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S132000-de-konfiture_extra', f."id", 'Konfitüre extra', 'konfiture extra', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S132000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S132000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S132000-hu-lekvar_sargabarack_szilva', f."id", 'lekvár (sárgabarack, szilva)', 'lekvar sargabarack szilva', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S132000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S132000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S132000-en-jam', f."id", 'jam', 'jam', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S132000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S132000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 57.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.023 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 234 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.305 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0314 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.118 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 93 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0156 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 56.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.008 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01111 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 24 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.902 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.138 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S132000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- S560000 Zartbitter-/Halbbitterschokolade: 534 kcal, P 6.62, F 32.26, carbs(total) 58.87, fiber 9.27

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-S560000', 'Zartbitter-/Halbbitterschokolade', '{"de":"Zartbitter-/Halbbitterschokolade","hu":"étcsokoládé (~50-60%)","en":"dark chocolate (semisweet)"}'::jsonb, '{}'::jsonb, 'bls', 'S560000', 'Zartbitter-/Halbbitterschokolade', 'Poultry', 'zartbitter halbbitterschokolade zartbitter halbbitterschokolade de zartbitter halbbitterschokolade hu etcsokolade 50 60 en dark chocolate semisweet', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 534, 32.26, 6.62, 58.87, 9.27)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S560000-de-zartbitter_halbbitterschokolade', f."id", 'Zartbitter-/Halbbitterschokolade', 'zartbitter halbbitterschokolade', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S560000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S560000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S560000-hu-etcsokolade_50_60', f."id", 'étcsokoládé (~50-60%)', 'etcsokolade 50 60', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S560000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S560000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S560000-en-dark_chocolate_semisweet', f."id", 'dark chocolate (semisweet)', 'dark chocolate semisweet', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S560000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S560000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 49.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 58.87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.1878 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 534 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.0903 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 140 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.2717 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 192.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.089 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 497.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.62 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 46.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 32.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.144 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.083 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.56 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.022 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 15.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.73 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.377 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.006 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S560000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- S570000 Bitterschokolade: 563 kcal, P 9.1, F 41.33, carbs(total) 43.81, fiber 10.11

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-S570000', 'Bitterschokolade', '{"de":"Bitterschokolade","hu":"étcsokoládé (70%)","en":"bittersweet chocolate (70%)"}'::jsonb, '{}'::jsonb, 'bls', 'S570000', 'Bitterschokolade', 'Poultry', 'bitterschokolade bitterschokolade de bitterschokolade hu etcsokolade 70 en bittersweet chocolate 70', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 563, 41.33, 9.1, 43.81, 10.11)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S570000-de-bitterschokolade', f."id", 'Bitterschokolade', 'bitterschokolade', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S570000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S570000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S570000-hu-etcsokolade_70', f."id", 'étcsokoládé (70%)', 'etcsokolade 70', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S570000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S570000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-S570000-en-bittersweet_chocolate_70', f."id", 'bittersweet chocolate (70%)', 'bittersweet chocolate 70', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"S570000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'S570000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 70.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 43.81 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.614 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 563 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.4553 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 198.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.6781 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 277 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 700.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 24.97 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 30 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 41.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.188 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.101 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.76 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.97 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.468 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.9729 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'S570000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- F840100 Rosine/Sultanine (Weinbeere getrocknet): 288 kcal, P 2.7, F 1, carbs(total) 67.2, fiber 5.4

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-F840100', 'Rosine/Sultanine (Weinbeere getrocknet)', '{"de":"Rosine/Sultanine (Weinbeere getrocknet)","hu":"mazsola","en":"raisins"}'::jsonb, '{}'::jsonb, 'bls', 'F840100', 'Rosine/Sultanine (Weinbeere getrocknet)', 'Fruit', 'rosine sultanine weinbeere getrocknet rosine sultanine weinbeere getrocknet de rosine sultanine weinbeere getrocknet hu mazsola en raisins', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 288, 1, 2.7, 67.2, 5.4)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F840100-de-rosine_sultanine_weinbeere_getrocknet', f."id", 'Rosine/Sultanine (Weinbeere getrocknet)', 'rosine sultanine weinbeere getrocknet', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F840100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F840100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F840100-hu-mazsola', f."id", 'mazsola', 'mazsola', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F840100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F840100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-F840100-en-raisins', f."id", 'raisins', 'raisins', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"F840100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'F840100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 67.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.37 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 288 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.36 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 32 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 101 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 773 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 60.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 32 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'F840100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U803000 Schaf Fleisch, grob entsehnt, roh: 181 kcal, P 18.4, F 11.9, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U803000', 'Schaf Fleisch, grob entsehnt, roh', '{"de":"Schaf Fleisch, grob entsehnt, roh","hu":"birkahús","en":"mutton meat"}'::jsonb, '{}'::jsonb, 'bls', 'U803000', 'Schaf Fleisch, grob entsehnt, roh', 'Oils and fats', 'schaf fleisch grob entsehnt roh schaf fleisch grob entsehnt roh de schaf fleisch grob entsehnt roh hu birkahus en mutton meat', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 181, 11.9, 18.4, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U803000-de-schaf_fleisch_grob_entsehnt_roh', f."id", 'Schaf Fleisch, grob entsehnt, roh', 'schaf fleisch grob entsehnt roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U803000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U803000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U803000-hu-birkahus', f."id", 'birkahús', 'birkahus', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U803000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U803000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U803000-en-mutton_meat', f."id", 'mutton meat', 'mutton meat', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U803000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U803000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.081 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 181 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.012 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 149 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.39 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 267 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 18.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 86 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.169 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.222 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.494 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.48 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U803000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- V551100 Rind Magen/Kutteln, roh: 80 kcal, P 13.5, F 2.84, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-V551100', 'Rind Magen/Kutteln, roh', '{"de":"Rind Magen/Kutteln, roh","hu":"marhapacal","en":"beef tripe"}'::jsonb, '{}'::jsonb, 'bls', 'V551100', 'Rind Magen/Kutteln, roh', 'BLS group V', 'rind magen kutteln roh rind magen kutteln roh de rind magen kutteln roh hu marhapacal en beef tripe', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 80, 2.84, 13.5, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V551100-de-rind_magen_kutteln_roh', f."id", 'Rind Magen/Kutteln, roh', 'rind magen kutteln roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V551100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V551100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V551100-hu-marhapacal', f."id", 'marhapacal', 'marhapacal', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V551100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V551100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-V551100-en-beef_tripe', f."id", 'beef tripe', 'beef tripe', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"V551100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'V551100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 90 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 80 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 112 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.144 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 142 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 89 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.84 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.026 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.128 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.41 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.484 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.024 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.89 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 54.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.57 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'V551100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U672100 Schwein Vordereisbein/Vorderhaxe, roh: 200 kcal, P 22.99, F 12.06, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U672100', 'Schwein Vordereisbein/Vorderhaxe, roh', '{"de":"Schwein Vordereisbein/Vorderhaxe, roh","hu":"sertéscsülök (nyers)","en":"pork hock, raw"}'::jsonb, '{}'::jsonb, 'bls', 'U672100', 'Schwein Vordereisbein/Vorderhaxe, roh', 'Oils and fats', 'schwein vordereisbein vorderhaxe roh schwein vordereisbein vorderhaxe roh de schwein vordereisbein vorderhaxe roh hu sertescsulok nyers en pork hock raw', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 200, 12.06, 22.99, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672100-de-schwein_vordereisbein_vorderhaxe_roh', f."id", 'Schwein Vordereisbein/Vorderhaxe, roh', 'schwein vordereisbein vorderhaxe roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U672100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672100-hu-sertescsulok_nyers', f."id", 'sertéscsülök (nyers)', 'sertescsulok nyers', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U672100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U672100-en-pork_hock_raw', f."id", 'pork hock, raw', 'pork hock raw', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U672100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U672100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07579999999999999 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 200 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9144 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0083 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.386 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 138.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.0472 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 288.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 22.99 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.822 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 100.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.21 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.65 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.298 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.705 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.36 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.7871 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U672100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U632100 Schwein Kamm, roh: 175 kcal, P 19.21, F 10.9, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U632100', 'Schwein Kamm, roh', '{"de":"Schwein Kamm, roh","hu":"sertéstarja","en":"pork neck (collar)"}'::jsonb, '{}'::jsonb, 'bls', 'U632100', 'Schwein Kamm, roh', 'Oils and fats', 'schwein kamm roh schwein kamm roh de schwein kamm roh hu sertestarja en pork neck collar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 175, 10.9, 19.21, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U632100-de-schwein_kamm_roh', f."id", 'Schwein Kamm, roh', 'schwein kamm roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U632100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U632100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U632100-hu-sertestarja', f."id", 'sertéstarja', 'sertestarja', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U632100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U632100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U632100-en-pork_neck_collar', f."id", 'pork neck (collar)', 'pork neck collar', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U632100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U632100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.073 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 175 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8821 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0089 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.321 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 164.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.017 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 345.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.21 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.061 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 54.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.74 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.92 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.392 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.833 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.7119 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U632100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U687000 Schwein Oberschale (ohne Deckel) roh: 115 kcal, P 23.01, F 2.51, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U687000', 'Schwein Oberschale (ohne Deckel) roh', '{"de":"Schwein Oberschale (ohne Deckel) roh","hu":"sertéscomb","en":"pork leg (top round)"}'::jsonb, '{}'::jsonb, 'bls', 'U687000', 'Schwein Oberschale (ohne Deckel) roh', 'Oils and fats', 'schwein oberschale ohne deckel roh schwein oberschale ohne deckel roh de schwein oberschale ohne deckel roh hu sertescomb en pork leg top round', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 115, 2.51, 23.01, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U687000-de-schwein_oberschale_ohne_deckel_roh', f."id", 'Schwein Oberschale (ohne Deckel) roh', 'schwein oberschale ohne deckel roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U687000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U687000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U687000-hu-sertescomb', f."id", 'sertéscomb', 'sertescomb', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U687000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U687000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U687000-en-pork_leg_top_round', f."id", 'pork leg (top round)', 'pork leg top round', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U687000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U687000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.055200000000000006 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 115 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5706 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 25.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0076 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.044 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 204.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.209 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 401.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.781 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 47.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.51 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.49 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.603 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.62 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.442 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.5473 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U687000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U564100 Schwein Dicke Rippe roh: 196 kcal, P 19.66, F 13.07, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U564100', 'Schwein Dicke Rippe roh', '{"de":"Schwein Dicke Rippe roh","hu":"sertésoldalas","en":"pork ribs (belly ribs)"}'::jsonb, '{}'::jsonb, 'bls', 'U564100', 'Schwein Dicke Rippe roh', 'Oils and fats', 'schwein dicke rippe roh schwein dicke rippe roh de schwein dicke rippe roh hu sertesoldalas en pork ribs belly ribs', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 196, 13.07, 19.66, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U564100-de-schwein_dicke_rippe_roh', f."id", 'Schwein Dicke Rippe roh', 'schwein dicke rippe roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U564100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U564100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U564100-hu-sertesoldalas', f."id", 'sertésoldalas', 'sertesoldalas', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U564100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U564100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U564100-en-pork_ribs_belly_ribs', f."id", 'pork ribs (belly ribs)', 'pork ribs belly ribs', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U564100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U564100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0683 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 196 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.7816 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.008400000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 169.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 333.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.66 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 69.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 13.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.53 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.37 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.82 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.63 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.441 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.85 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.818 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.3238 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U564100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U221100 Rind Roastbeef (Rücken) roh: 130 kcal, P 22.45, F 4.45, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U221100', 'Rind Roastbeef (Rücken) roh', '{"de":"Rind Roastbeef (Rücken) roh","hu":"marha hátszín","en":"beef striploin"}'::jsonb, '{}'::jsonb, 'bls', 'U221100', 'Rind Roastbeef (Rücken) roh', 'Oils and fats', 'rind roastbeef rucken roh rind roastbeef rucken roh de rind roastbeef rucken roh hu marha hatszin en beef striploin', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 130, 4.45, 22.45, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U221100-de-rind_roastbeef_rucken_roh', f."id", 'Rind Roastbeef (Rücken) roh', 'rind roastbeef rucken roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U221100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U221100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U221100-hu-marha_hatszin', f."id", 'marha hátszín', 'marha hatszin', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U221100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U221100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U221100-en-beef_striploin', f."id", 'beef striploin', 'beef striploin', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U221100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U221100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.191 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.079 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 130 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.992 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 23.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.995 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 157 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.226 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 356.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 22.45 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.943 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 55 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.45 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.84 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.57 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.081 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U221100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- U261100 Rind Bug/Schulter, roh: 128 kcal, P 20.2, F 5.3, carbs(total) 0, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-U261100', 'Rind Bug/Schulter, roh', '{"de":"Rind Bug/Schulter, roh","hu":"marhalapocka","en":"beef shoulder (chuck)"}'::jsonb, '{}'::jsonb, 'bls', 'U261100', 'Rind Bug/Schulter, roh', 'Oils and fats', 'rind bug schulter roh rind bug schulter roh de rind bug schulter roh hu marhalapocka en beef shoulder chuck', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 128, 5.3, 20.2, 0, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U261100-de-rind_bug_schulter_roh', f."id", 'Rind Bug/Schulter, roh', 'rind bug schulter roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U261100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U261100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U261100-hu-marhalapocka', f."id", 'marhalapocka', 'marhalapocka', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U261100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U261100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-U261100-en-beef_shoulder_chuck', f."id", 'beef shoulder (chuck)', 'beef shoulder chuck', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"U261100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'U261100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.818 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.073 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 128 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.289 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.193 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.389 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 165 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.282 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 295.964 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 20.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.325 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 50 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.199 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'U261100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- K750100 Mischpilze roh: 34 kcal, P 3.5, F 0.3, carbs(total) 7.26, fiber 5.1

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-K750100', 'Mischpilze roh', '{"de":"Mischpilze roh","hu":"erdei gomba (vegyes)","en":"mixed mushrooms"}'::jsonb, '{}'::jsonb, 'bls', 'K750100', 'Mischpilze roh', 'Potatoes', 'mischpilze roh mischpilze roh de mischpilze roh hu erdei gomba vegyes en mixed mushrooms', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 34, 0.3, 3.5, 7.26, 5.1)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-K750100-de-mischpilze_roh', f."id", 'Mischpilze roh', 'mischpilze roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"K750100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'K750100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-K750100-hu-erdei_gomba_vegyes', f."id", 'erdei gomba (vegyes)', 'erdei gomba vegyes', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"K750100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'K750100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-K750100-en-mixed_mushrooms', f."id", 'mixed mushrooms', 'mixed mushrooms', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"K750100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'K750100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.011 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 73 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 274 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.041 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.97 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.082 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.64 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 35 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.91 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.016 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.65 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'K750100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- R160000 Tomatenmark: 81 kcal, P 3.4, F 0.2, carbs(total) 17.9, fiber 4.7

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-R160000', 'Tomatenmark', '{"de":"Tomatenmark","hu":"sűrített paradicsom (paradicsompüré)","en":"tomato paste"}'::jsonb, '{}'::jsonb, 'bls', 'R160000', 'Tomatenmark', 'Meat', 'tomatenmark tomatenmark de tomatenmark hu suritett paradicsom paradicsompure en tomato paste', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 81, 0.2, 3.4, 17.9, 4.7)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R160000-de-tomatenmark', f."id", 'Tomatenmark', 'tomatenmark', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R160000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R160000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R160000-hu-suritett_paradicsom_paradicsompure', f."id", 'sűrített paradicsom (paradicsompüré)', 'suritett paradicsom paradicsompure', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R160000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R160000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R160000-en-tomato_paste', f."id", 'tomato paste', 'tomato paste', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R160000","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R160000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.264 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 81 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.146 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 44 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 64 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.08 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1114 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 320 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 70 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.54 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 39 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 67.54 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.8663 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.46 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R160000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- R161200 Tomaten passiert/Tomatenpüree: 29 kcal, P 1.18, F 0.1, carbs(total) 5.75, fiber 1.81

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-R161200', 'Tomaten passiert/Tomatenpüree', '{"de":"Tomaten passiert/Tomatenpüree","hu":"paradicsomlé / passata","en":"tomato passata"}'::jsonb, '{}'::jsonb, 'bls', 'R161200', 'Tomaten passiert/Tomatenpüree', 'Meat', 'tomaten passiert tomatenpuree tomaten passiert tomatenpuree de tomaten passiert tomatenpuree hu paradicsomle passata en tomato passata', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 29, 0.1, 1.18, 5.75, 1.81)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R161200-de-tomaten_passiert_tomatenpuree', f."id", 'Tomaten passiert/Tomatenpüree', 'tomaten passiert tomatenpuree', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R161200","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R161200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R161200-hu-paradicsomle_passata', f."id", 'paradicsomlé / passata', 'paradicsomle passata', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R161200","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R161200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-R161200-en-tomato_passata', f."id", 'tomato passata', 'tomato passata', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"R161200","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'R161200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17.83 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.75 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0932 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.81 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.60046 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.09909000000000001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 25.22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 229.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 124.29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.069 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.38 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.44 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.153 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.16578 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'R161200' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- M505600 Trappistenkäse mind. 45 % Fett i. Tr.: 345 kcal, P 25.1, F 26.8, carbs(total) 0.01, fiber 0

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-M505600', 'Trappistenkäse mind. 45 % Fett i. Tr.', '{"de":"Trappistenkäse mind. 45 % Fett i. Tr.","hu":"trappista sajt","en":"Trappist cheese"}'::jsonb, '{}'::jsonb, 'bls', 'M505600', 'Trappistenkäse mind. 45 % Fett i. Tr.', 'Dairy', 'trappistenkase mind 45 fett i tr trappistenkase mind 45 fett i tr de trappistenkase mind 45 fett i tr hu trappista sajt en trappist cheese', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 345, 26.8, 25.1, 0.01, 0)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M505600-de-trappistenkase_mind_45_fett_i_tr', f."id", 'Trappistenkäse mind. 45 % Fett i. Tr.', 'trappistenkase mind 45 fett i tr', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M505600","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M505600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M505600-hu-trappista_sajt', f."id", 'trappista sajt', 'trappista sajt', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M505600","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M505600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-M505600-en-trappist_cheese', f."id", 'Trappist cheese', 'trappist cheese', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"M505600","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'M505600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 750 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 345 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 37 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 500 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 100 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 25.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 14 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 600 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 26.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 313 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.35 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 30 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.54 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 15.85 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'M505600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- G482100 Frühlingszwiebel/Lauchzwiebel, roh: 27 kcal, P 1.9, F 0.19, carbs(total) 5.6, fiber 2.6

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-G482100', 'Frühlingszwiebel/Lauchzwiebel, roh', '{"de":"Frühlingszwiebel/Lauchzwiebel, roh","hu":"újhagyma","en":"spring onion"}'::jsonb, '{}'::jsonb, 'bls', 'G482100', 'Frühlingszwiebel/Lauchzwiebel, roh', 'Vegetables', 'fruhlingszwiebel lauchzwiebel roh fruhlingszwiebel lauchzwiebel roh de fruhlingszwiebel lauchzwiebel roh hu ujhagyma en spring onion', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 27, 0.19, 1.9, 5.6, 2.6)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G482100-de-fruhlingszwiebel_lauchzwiebel_roh', f."id", 'Frühlingszwiebel/Lauchzwiebel, roh', 'fruhlingszwiebel lauchzwiebel roh', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G482100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G482100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G482100-hu-ujhagyma', f."id", 'újhagyma', 'ujhagyma', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G482100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G482100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-G482100-en-spring_onion', f."id", 'spring onion', 'spring onion', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"G482100","via":"reviewed_migration_regional_hu"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'G482100'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 56 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.044 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 27 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.69 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 16 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.26 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 268 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.032 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 89 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.35 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 54 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'G482100' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;
