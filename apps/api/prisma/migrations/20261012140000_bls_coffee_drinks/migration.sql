-- Coffee drinks (owner decision 2026-10-13 on PR #85: "vegyük fel a kávékat").
-- Official BLS 4.0 prepared coffee-drink records that production does not
-- have yet: tejeskávé / Milchkaffee, coffee with milk, cappuccino, latte
-- macchiato, plus the sweetened, evaporated-milk and iced variants.
-- The list and the curated names live in data/catalog-names/bls-coffee-drinks.json;
-- regenerate with
--   cd apps/api && npx tsx src/importers/bls-migration-sql.ts <BLS_4_0_Daten_2025_DE.xlsx> \
--     ../../data/catalog-names/bls-coffee-drinks.json prisma/migrations/20261012140000_bls_coffee_drinks/migration.sql \
--     reviewed_migration_coffee_drinks
-- Source: BLS_4_0_Daten_2025_DE.xlsx (blsdb.de, CC BY 4.0, Max Rubner-Institut
-- 2025) through the repo's own BlsAdapter, so values, the total-carbohydrate
-- conversion (CHO + FIBT) and the provenance match a regular import.
-- Inserts only (ON CONFLICT DO NOTHING); user data is never touched. A record
-- that already exists is left as it is.
-- The unsweetened tejeskávé, coffee with milk, cappuccino and latte macchiato
-- also carry the shared bare word kávé / Kaffee / coffee, so the bare word
-- offers them next to the black-coffee records (20261012130000).
-- Not in BLS 4.0 (and not added): flat white, Wiener Melange, Verlängerter.
-- N420100 "Kaffee (Getränk) aus Instantpulver" lacks a required macro in BLS 4.0, so it is not imported.

-- BEGIN GENERATED (bls-migration-sql.ts)

-- N491000 Kaffee (Getränk) halb und halb, mit Milch 3,5 % Fett: 31 kcal, P 1.84, F 1.74, carbs(total) 2.167, fiber 0.15712

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N491000', 'Kaffee (Getränk) halb und halb, mit Milch 3,5 % Fett', '{"de":"Kaffee (Getränk) halb und halb, mit Milch 3,5 % Fett","hu":"tejeskávé (fele kávé, fele tej 3,5%)","en":"coffee with milk, half and half (milk 3.5%)"}'::jsonb, '{"hu":["tejeskávé","tejes kávé","kávé tejjel fele-fele","kávé"],"de":["Milchkaffee","Kaffee halb und halb","Café au lait","Kaffee"],"en":["café au lait","milky coffee","coffee"]}'::jsonb, 'bls', 'N491000', 'Kaffee (Getränk) halb und halb, mit Milch 3,5 % Fett', 'Nuts and seeds', 'kaffee getrank halb und halb mit milch 3 5 fett kaffee getrank halb und halb mit milch 3 5 fett de kaffee getrank halb und halb mit milch 3 5 fett hu tejeskave fele kave fele tej 3 5 en coffee with milk half and half milk 3 5 hu tejeskave tejes kave kave tejjel fele fele kave de milchkaffee kaffee halb und halb cafe au lait kaffee en cafe au lait milky coffee coffee', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 31, 1.74, 1.84, 2.167, 0.15712)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-de-kaffee_getrank_halb_und_halb_mit_milch_3_5_fett', f."id", 'Kaffee (Getränk) halb und halb, mit Milch 3,5 % Fett', 'kaffee getrank halb und halb mit milch 3 5 fett', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-hu-tejeskave_fele_kave_fele_tej_3_5', f."id", 'tejeskávé (fele kávé, fele tej 3,5%)', 'tejeskave fele kave fele tej 3 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-en-coffee_with_milk_half_and_half_milk_3_5', f."id", 'coffee with milk, half and half (milk 3.5%)', 'coffee with milk half and half milk 3 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-hu-tejeskave', f."id", 'tejeskávé', 'tejeskave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-hu-tejes_kave', f."id", 'tejes kávé', 'tejes kave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-hu-kave_tejjel_fele_fele', f."id", 'kávé tejjel fele-fele', 'kave tejjel fele fele', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-hu-kave', f."id", 'kávé', 'kave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-de-milchkaffee', f."id", 'Milchkaffee', 'milchkaffee', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-de-kaffee_halb_und_halb', f."id", 'Kaffee halb und halb', 'kaffee halb und halb', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-de-cafe_au_lait', f."id", 'Café au lait', 'cafe au lait', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-de-kaffee', f."id", 'Kaffee', 'kaffee', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-en-cafe_au_lait', f."id", 'café au lait', 'cafe au lait', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-en-milky_coffee', f."id", 'milky coffee', 'milky coffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N491000-en-coffee', f."id", 'coffee', 'coffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N491000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N491000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 62 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.167 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0134 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 31 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.15712 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.019 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0354 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.387 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 49.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.035 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 131.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.84 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.105 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.74 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.032 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.069 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.576 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.235 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.892 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.47786 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.058 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.18 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N491000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N410200 Kaffee (Getränk) mit Milch 3,5 % Fett: 3 kcal, P 0.23, F 0.12, carbs(total) 0.434, fiber 0.30378

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N410200', 'Kaffee (Getränk) mit Milch 3,5 % Fett', '{"de":"Kaffee (Getränk) mit Milch 3,5 % Fett","hu":"kávé egy kevés tejjel (3,5%)","en":"coffee with a dash of milk (3.5%)"}'::jsonb, '{"hu":["kávé tejjel","kávé kevés tejjel","kávé"],"de":["Kaffee mit Milch","Kaffee"],"en":["coffee with milk","white coffee","coffee"]}'::jsonb, 'bls', 'N410200', 'Kaffee (Getränk) mit Milch 3,5 % Fett', 'Nuts and seeds', 'kaffee getrank mit milch 3 5 fett kaffee getrank mit milch 3 5 fett de kaffee getrank mit milch 3 5 fett hu kave egy keves tejjel 3 5 en coffee with a dash of milk 3 5 hu kave tejjel kave keves tejjel kave de kaffee mit milch kaffee en coffee with milk white coffee coffee', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 3, 0.12, 0.23, 0.434, 0.30378)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-de-kaffee_getrank_mit_milch_3_5_fett', f."id", 'Kaffee (Getränk) mit Milch 3,5 % Fett', 'kaffee getrank mit milch 3 5 fett', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-hu-kave_egy_keves_tejjel_3_5', f."id", 'kávé egy kevés tejjel (3,5%)', 'kave egy keves tejjel 3 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-en-coffee_with_a_dash_of_milk_3_5', f."id", 'coffee with a dash of milk (3.5%)', 'coffee with a dash of milk 3 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-hu-kave_tejjel', f."id", 'kávé tejjel', 'kave tejjel', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-hu-kave_keves_tejjel', f."id", 'kávé kevés tejjel', 'kave keves tejjel', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-hu-kave', f."id", 'kávé', 'kave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-de-kaffee_mit_milch', f."id", 'Kaffee mit Milch', 'kaffee mit milch', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-de-kaffee', f."id", 'Kaffee', 'kaffee', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-en-coffee_with_milk', f."id", 'coffee with milk', 'coffee with milk', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-en-white_coffee', f."id", 'white coffee', 'white coffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410200-en-coffee', f."id", 'coffee', 'coffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.434 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.30378 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0663 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.026 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 110.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.073 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.13 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.005 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.689 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.096 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.126 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03186 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.022 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410200' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N414000 Cappuccino (Getränk) mit Milch 3,5 % Fett: 50 kcal, P 2.9, F 2.79, carbs(total) 3.304, fiber 0.084

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N414000', 'Cappuccino (Getränk) mit Milch 3,5 % Fett', '{"de":"Cappuccino (Getränk) mit Milch 3,5 % Fett","hu":"cappuccino (tej 3,5%)","en":"cappuccino (milk 3.5%)"}'::jsonb, '{"hu":["cappuccino","kapucsínó","kávé"],"de":["Cappuccino","Kaffee"],"en":["cappuccino","coffee"]}'::jsonb, 'bls', 'N414000', 'Cappuccino (Getränk) mit Milch 3,5 % Fett', 'Nuts and seeds', 'cappuccino getrank mit milch 3 5 fett cappuccino getrank mit milch 3 5 fett de cappuccino getrank mit milch 3 5 fett hu cappuccino tej 3 5 en cappuccino milk 3 5 hu cappuccino kapucsino kave de cappuccino kaffee en cappuccino coffee', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 50, 2.79, 2.9, 3.304, 0.084)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-de-cappuccino_getrank_mit_milch_3_5_fett', f."id", 'Cappuccino (Getränk) mit Milch 3,5 % Fett', 'cappuccino getrank mit milch 3 5 fett', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-hu-cappuccino_tej_3_5', f."id", 'cappuccino (tej 3,5%)', 'cappuccino tej 3 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-en-cappuccino_milk_3_5', f."id", 'cappuccino (milk 3.5%)', 'cappuccino milk 3 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-hu-cappuccino', f."id", 'cappuccino', 'cappuccino', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-hu-kapucsino', f."id", 'kapucsínó', 'kapucsino', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-hu-kave', f."id", 'kávé', 'kave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-de-cappuccino', f."id", 'Cappuccino', 'cappuccino', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-de-kaffee', f."id", 'Kaffee', 'kaffee', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-en-cappuccino', f."id", 'cappuccino', 'cappuccino', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N414000-en-coffee', f."id", 'coffee', 'coffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N414000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N414000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 95 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.304 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 50 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.084 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.622 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 76 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.054 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 134 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.768 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.79 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.052 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.128 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.313 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.032 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.028 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.077 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N414000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N4A3300 Cappuccino (Getränk) mit Milch 3,5 % Fett und Zucker: 58 kcal, P 2.9, F 2.73, carbs(total) 5.422, fiber 0.082

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N4A3300', 'Cappuccino (Getränk) mit Milch 3,5 % Fett und Zucker', '{"de":"Cappuccino (Getränk) mit Milch 3,5 % Fett und Zucker","hu":"cukros cappuccino (tej 3,5%)","en":"cappuccino with sugar (milk 3.5%)"}'::jsonb, '{"hu":["cukros cappuccino"],"de":["Cappuccino mit Zucker"],"en":["cappuccino with sugar"]}'::jsonb, 'bls', 'N4A3300', 'Cappuccino (Getränk) mit Milch 3,5 % Fett und Zucker', 'Nuts and seeds', 'cappuccino getrank mit milch 3 5 fett und zucker cappuccino getrank mit milch 3 5 fett und zucker de cappuccino getrank mit milch 3 5 fett und zucker hu cukros cappuccino tej 3 5 en cappuccino with sugar milk 3 5 hu cukros cappuccino de cappuccino mit zucker en cappuccino with sugar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 58, 2.73, 2.9, 5.422, 0.082)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N4A3300-de-cappuccino_getrank_mit_milch_3_5_fett_und_zucker', f."id", 'Cappuccino (Getränk) mit Milch 3,5 % Fett und Zucker', 'cappuccino getrank mit milch 3 5 fett und zucker', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N4A3300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N4A3300-hu-cukros_cappuccino_tej_3_5', f."id", 'cukros cappuccino (tej 3,5%)', 'cukros cappuccino tej 3 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N4A3300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N4A3300-en-cappuccino_with_sugar_milk_3_5', f."id", 'cappuccino with sugar (milk 3.5%)', 'cappuccino with sugar milk 3 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N4A3300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N4A3300-hu-cukros_cappuccino', f."id", 'cukros cappuccino', 'cukros cappuccino', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N4A3300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N4A3300-de-cappuccino_mit_zucker', f."id", 'Cappuccino mit Zucker', 'cappuccino mit zucker', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N4A3300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N4A3300-en-cappuccino_with_sugar', f."id", 'cappuccino with sugar', 'cappuccino with sugar', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N4A3300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 93 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.422 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 58 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.082 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.608 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 74 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.053 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 132 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.729 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.73 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.051 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.125 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.87 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.306 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.031 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.962 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.075 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N4A3300' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N418000 Latte macchiato (Getränk) mit Milch 3,5 % Fett: 50 kcal, P 2.9, F 2.79, carbs(total) 3.304, fiber 0.084

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N418000', 'Latte macchiato (Getränk) mit Milch 3,5 % Fett', '{"de":"Latte macchiato (Getränk) mit Milch 3,5 % Fett","hu":"latte macchiato (tej 3,5%)","en":"latte macchiato (milk 3.5%)"}'::jsonb, '{"hu":["latte macchiato","latte","caffè latte","kávé"],"de":["Latte macchiato","Kaffee"],"en":["latte macchiato","latte","caffe latte","coffee"]}'::jsonb, 'bls', 'N418000', 'Latte macchiato (Getränk) mit Milch 3,5 % Fett', 'Nuts and seeds', 'latte macchiato getrank mit milch 3 5 fett latte macchiato getrank mit milch 3 5 fett de latte macchiato getrank mit milch 3 5 fett hu latte macchiato tej 3 5 en latte macchiato milk 3 5 hu latte macchiato latte caffe latte kave de latte macchiato kaffee en latte macchiato latte caffe latte coffee', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 50, 2.79, 2.9, 3.304, 0.084)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-de-latte_macchiato_getrank_mit_milch_3_5_fett', f."id", 'Latte macchiato (Getränk) mit Milch 3,5 % Fett', 'latte macchiato getrank mit milch 3 5 fett', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-hu-latte_macchiato_tej_3_5', f."id", 'latte macchiato (tej 3,5%)', 'latte macchiato tej 3 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-en-latte_macchiato_milk_3_5', f."id", 'latte macchiato (milk 3.5%)', 'latte macchiato milk 3 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-hu-latte_macchiato', f."id", 'latte macchiato', 'latte macchiato', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-hu-latte', f."id", 'latte', 'latte', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-hu-caffe_latte', f."id", 'caffè latte', 'caffe latte', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-hu-kave', f."id", 'kávé', 'kave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-de-latte_macchiato', f."id", 'Latte macchiato', 'latte macchiato', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-de-kaffee', f."id", 'Kaffee', 'kaffee', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-en-latte_macchiato', f."id", 'latte macchiato', 'latte macchiato', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-en-latte', f."id", 'latte', 'latte', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-en-caffe_latte', f."id", 'caffe latte', 'caffe latte', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N418000-en-coffee', f."id", 'coffee', 'coffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N418000","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N418000'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 95 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.304 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 50 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.084 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 17 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.622 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 76 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.054 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 134 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.768 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 29 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.79 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 19 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.052 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.128 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.88 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.313 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.032 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.028 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.077 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N418000' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N410300 Kaffee (Getränk) mit Milch 3,5 % Fett und Zucker: 10 kcal, P 0.23, F 0.11, carbs(total) 2.228, fiber 0.29831

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N410300', 'Kaffee (Getränk) mit Milch 3,5 % Fett und Zucker', '{"de":"Kaffee (Getränk) mit Milch 3,5 % Fett und Zucker","hu":"tejes-cukros kávé (tej 3,5%)","en":"coffee with milk and sugar (milk 3.5%)"}'::jsonb, '{"hu":["tejes cukros kávé"],"de":["Kaffee mit Milch und Zucker"],"en":["coffee with milk and sugar"]}'::jsonb, 'bls', 'N410300', 'Kaffee (Getränk) mit Milch 3,5 % Fett und Zucker', 'Nuts and seeds', 'kaffee getrank mit milch 3 5 fett und zucker kaffee getrank mit milch 3 5 fett und zucker de kaffee getrank mit milch 3 5 fett und zucker hu tejes cukros kave tej 3 5 en coffee with milk and sugar milk 3 5 hu tejes cukros kave de kaffee mit milch und zucker en coffee with milk and sugar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 10, 0.11, 0.23, 2.228, 0.29831)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410300-de-kaffee_getrank_mit_milch_3_5_fett_und_zucker', f."id", 'Kaffee (Getränk) mit Milch 3,5 % Fett und Zucker', 'kaffee getrank mit milch 3 5 fett und zucker', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410300-hu-tejes_cukros_kave_tej_3_5', f."id", 'tejes-cukros kávé (tej 3,5%)', 'tejes cukros kave tej 3 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410300-en-coffee_with_milk_and_sugar_milk_3_5', f."id", 'coffee with milk and sugar (milk 3.5%)', 'coffee with milk and sugar milk 3 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410300-hu-tejes_cukros_kave', f."id", 'tejes cukros kávé', 'tejes cukros kave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410300-de-kaffee_mit_milch_und_zucker', f."id", 'Kaffee mit Milch und Zucker', 'kaffee mit milch und zucker', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410300-en-coffee_with_milk_and_sugar', f."id", 'coffee with milk and sugar', 'coffee with milk and sugar', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410300","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410300'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.228 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.0197 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.29831 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.023 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.065 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.025 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 108.5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.23 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.072 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.93 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.11 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.8 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.005 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.677 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.094 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.001 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.124 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.42 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03128 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.022 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410300' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N410600 Kaffee (Getränk) mit Zucker: 9 kcal, P 0.12, F 0, carbs(total) 2.169, fiber 0.3084

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N410600', 'Kaffee (Getränk) mit Zucker', '{"de":"Kaffee (Getränk) mit Zucker","hu":"cukros kávé","en":"coffee with sugar"}'::jsonb, '{"hu":["cukros kávé","feketekávé cukorral"],"de":["Kaffee mit Zucker"],"en":["coffee with sugar"]}'::jsonb, 'bls', 'N410600', 'Kaffee (Getränk) mit Zucker', 'Nuts and seeds', 'kaffee getrank mit zucker kaffee getrank mit zucker de kaffee getrank mit zucker hu cukros kave en coffee with sugar hu cukros kave feketekave cukorral de kaffee mit zucker en coffee with sugar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 9, 0, 0.12, 2.169, 0.3084)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410600-de-kaffee_getrank_mit_zucker', f."id", 'Kaffee (Getränk) mit Zucker', 'kaffee getrank mit zucker', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410600","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410600-hu-cukros_kave', f."id", 'cukros kávé', 'cukros kave', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410600","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410600-en-coffee_with_sugar', f."id", 'coffee with sugar', 'coffee with sugar', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410600","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410600-hu-feketekave_cukorral', f."id", 'feketekávé cukorral', 'feketekave cukorral', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410600","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410600-de-kaffee_mit_zucker', f."id", 'Kaffee mit Zucker', 'kaffee mit zucker', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410600","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410600'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.169 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.020100000000000003 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3084 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.023 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.067 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 107 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.861 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.684 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.084 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.28 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.06 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410600' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N411200 Espresso (Getränk) mit Zucker: 43 kcal, P 0.4, F 0, carbs(total) 10.448, fiber 0.376

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N411200', 'Espresso (Getränk) mit Zucker', '{"de":"Espresso (Getränk) mit Zucker","hu":"cukros eszpresszó","en":"espresso with sugar"}'::jsonb, '{"hu":["cukros eszpresszó"],"de":["Espresso mit Zucker"],"en":["espresso with sugar"]}'::jsonb, 'bls', 'N411200', 'Espresso (Getränk) mit Zucker', 'Nuts and seeds', 'espresso getrank mit zucker espresso getrank mit zucker de espresso getrank mit zucker hu cukros eszpresszo en espresso with sugar hu cukros eszpresszo de espresso mit zucker en espresso with sugar', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 43, 0, 0.4, 10.448, 0.376)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N411200-de-espresso_getrank_mit_zucker', f."id", 'Espresso (Getränk) mit Zucker', 'espresso getrank mit zucker', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N411200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N411200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N411200-hu-cukros_eszpresszo', f."id", 'cukros eszpresszó', 'cukros eszpresszo', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N411200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N411200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N411200-en-espresso_with_sugar', f."id", 'espresso with sugar', 'espresso with sugar', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N411200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N411200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N411200-de-espresso_mit_zucker', f."id", 'Espresso mit Zucker', 'espresso mit zucker', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N411200","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N411200'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.448 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 43 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.376 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 37 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 52 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10.072 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.079 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.34 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.025 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.1 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.00512 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.055 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N411200' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- N410400 Kaffee (Getränk) mit Kondensmilch 7,5 % Fett: 5 kcal, P 0.33, F 0.252, carbs(total) 0.615, fiber 0.30378

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-N410400', 'Kaffee (Getränk) mit Kondensmilch 7,5 % Fett', '{"de":"Kaffee (Getränk) mit Kondensmilch 7,5 % Fett","hu":"kávé sűrített tejjel (7,5%)","en":"coffee with evaporated milk (7.5%)"}'::jsonb, '{"hu":["kávé sűrített tejjel","kávé kávétejjel"],"de":["Kaffee mit Kondensmilch"],"en":["coffee with evaporated milk"]}'::jsonb, 'bls', 'N410400', 'Kaffee (Getränk) mit Kondensmilch 7,5 % Fett', 'Nuts and seeds', 'kaffee getrank mit kondensmilch 7 5 fett kaffee getrank mit kondensmilch 7 5 fett de kaffee getrank mit kondensmilch 7 5 fett hu kave suritett tejjel 7 5 en coffee with evaporated milk 7 5 hu kave suritett tejjel kave kavetejjel de kaffee mit kondensmilch en coffee with evaporated milk', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 5, 0.252, 0.33, 0.615, 0.30378)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-de-kaffee_getrank_mit_kondensmilch_7_5_fett', f."id", 'Kaffee (Getränk) mit Kondensmilch 7,5 % Fett', 'kaffee getrank mit kondensmilch 7 5 fett', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-hu-kave_suritett_tejjel_7_5', f."id", 'kávé sűrített tejjel (7,5%)', 'kave suritett tejjel 7 5', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-en-coffee_with_evaporated_milk_7_5', f."id", 'coffee with evaporated milk (7.5%)', 'coffee with evaporated milk 7 5', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-hu-kave_suritett_tejjel', f."id", 'kávé sűrített tejjel', 'kave suritett tejjel', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-hu-kave_kavetejjel', f."id", 'kávé kávétejjel', 'kave kavetejjel', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-de-kaffee_mit_kondensmilch', f."id", 'Kaffee mit Kondensmilch', 'kaffee mit kondensmilch', 'de', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-N410400-en-coffee_with_evaporated_milk', f."id", 'coffee with evaporated milk', 'coffee with evaporated milk', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"N410400","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'N410400'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 15 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.615 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.021 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 5 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.30378 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.022 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.066 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.067 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 12 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.006 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 116 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.33 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.138 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.311 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.252 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.01 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.012 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.68 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.104 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.002 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.07 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.025 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.04 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'N410400' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

-- Y997043 Eiskaffee: 116 kcal, P 1.9, F 8.6, carbs(total) 7.719, fiber 0.219

INSERT INTO "ketomentor"."Food" ("id", "name", "names", "synonyms", "source", "sourceId", "originalName", "category", "searchText", "provenance", "kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g")
VALUES ('bls-Y997043', 'Eiskaffee', '{"de":"Eiskaffee","hu":"jegeskávé (fagylalttal)","en":"iced coffee with ice cream (Eiskaffee)"}'::jsonb, '{"hu":["jegeskávé"],"de":["Eiskaffee"],"en":["Eiskaffee"]}'::jsonb, 'bls', 'Y997043', 'Eiskaffee', 'BLS group Y', 'eiskaffee eiskaffee de eiskaffee hu jegeskave fagylalttal en iced coffee with ice cream eiskaffee hu jegeskave de eiskaffee en eiskaffee', '{"source":"Bundeslebensmittelschlüssel","version":"4.0 (2025)","sourceUrl":"https://blsdb.de/download","license":"CC-BY-4.0","attribution":"Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.","valuesPer":"100 g","carbohydrateBasis":"total_from_available_plus_fiber"}'::jsonb, 116, 8.6, 1.9, 7.719, 0.219)
ON CONFLICT ("source", "sourceId") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y997043-de-eiskaffee', f."id", 'Eiskaffee', 'eiskaffee', 'de', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"Y997043","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y997043-hu-jegeskave_fagylalttal', f."id", 'jegeskávé (fagylalttal)', 'jegeskave fagylalttal', 'hu', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"Y997043","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y997043-en-iced_coffee_with_ice_cream_eiskaffee', f."id", 'iced coffee with ice cream (Eiskaffee)', 'iced coffee with ice cream eiskaffee', 'en', 'localized_name', 1, '{"method":"curated_import","source":"bls","sourceId":"Y997043","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y997043-hu-jegeskave', f."id", 'jegeskávé', 'jegeskave', 'hu', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y997043","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'bls-Y997043-en-eiskaffee', f."id", 'Eiskaffee', 'eiskaffee', 'en', 'synonym', 1, '{"method":"curated_import","source":"bls","sourceId":"Y997043","via":"reviewed_migration_coffee_drinks"}'::jsonb
FROM "ketomentor"."Food" f WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043'
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-calcium', 'calcium', 'Calcium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 49 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'calcium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-carbohydrate', 'carbohydrate', 'Carbohydrate', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.719 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'carbohydrate'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-copper', 'copper', 'Copper', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.03 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'copper'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-energy_kcal', 'energy_kcal', 'Energy', 'kcal', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 116 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'energy_kcal'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-fiber', 'fiber', 'Fiber', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.219 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'fiber'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-iron', 'iron', 'Iron', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'iron'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-magnesium', 'magnesium', 'Magnesium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 10 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'magnesium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-manganese', 'manganese', 'Manganese', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.05 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'manganese'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-monounsaturated_fat', 'monounsaturated_fat', 'Monounsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 2.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'monounsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-phosphorus', 'phosphorus', 'Phosphorus', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 53 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'phosphorus'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-polyunsaturated_fat', 'polyunsaturated_fat', 'Polyunsaturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'polyunsaturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-potassium', 'potassium', 'Potassium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 120 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'potassium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-protein', 'protein', 'Protein', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 1.9 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'protein'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-saturated_fat', 'saturated_fat', 'Saturated fat', 'g', 'fat') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'saturated_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sodium', 'sodium', 'Sodium', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 22 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'sodium'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-sugar', 'sugar', 'Sugar', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 7.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'sugar'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-total_fat', 'total_fat', 'Total fat', 'g', 'macro') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 8.6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'total_fat'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_a', 'vitamin_a', 'Vitamin A (RAE)', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 98 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_a'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b1', 'vitamin_b1', 'Vitamin B1', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.021 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b1'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b12', 'vitamin_b12', 'Vitamin B12', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b12'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b2', 'vitamin_b2', 'Vitamin B2', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.081 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b2'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b3', 'vitamin_b3', 'Vitamin B3', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.46 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b3'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b5', 'vitamin_b5', 'Vitamin B5', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b5'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b6', 'vitamin_b6', 'Vitamin B6', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.019 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b6'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b7', 'vitamin_b7', 'Vitamin B7', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 3 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b7'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_b9', 'vitamin_b9', 'Vitamin B9', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 6 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_b9'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_c', 'vitamin_c', 'Vitamin C', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.286 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_c'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_d', 'vitamin_d', 'Vitamin D', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.02 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_d'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_e', 'vitamin_e', 'Vitamin E', 'mg', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.324 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_e'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-vitamin_k', 'vitamin_k', 'Vitamin K', 'ug', 'vitamin') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 4 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'vitamin_k'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;

INSERT INTO "ketomentor"."Nutrient" ("id", "key", "label", "unit", "group") VALUES ('nutrient-zinc', 'zinc', 'Zinc', 'mg', 'mineral') ON CONFLICT ("key") DO NOTHING;
INSERT INTO "ketomentor"."FoodNutrient" ("foodId", "nutrientId", "amountPer100g")
SELECT f."id", n."id", 0.25 FROM "ketomentor"."Food" f, "ketomentor"."Nutrient" n
WHERE f."source" = 'bls' AND f."sourceId" = 'Y997043' AND n."key" = 'zinc'
ON CONFLICT ("foodId", "nutrientId") DO NOTHING;
