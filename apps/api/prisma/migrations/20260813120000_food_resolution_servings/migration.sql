-- Forward-only catalog resolution and serving support. Every object is
-- explicitly qualified so this migration cannot touch the shared public schema.
CREATE TABLE "ketomentor"."FoodAlias" (
  "id" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'und',
  "kind" TEXT NOT NULL DEFAULT 'synonym',
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "provenance" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodAlias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ketomentor"."FoodServing" (
  "id" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "labels" JSONB,
  "grams" DOUBLE PRECISION NOT NULL,
  "isEstimated" BOOLEAN NOT NULL DEFAULT false,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "provenance" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodServing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FoodServing_positive_grams_check" CHECK ("grams" > 0),
  CONSTRAINT "FoodServing_confidence_check" CHECK ("confidence" >= 0 AND "confidence" <= 1)
);

ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "inputQuantity" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "inputUnit" TEXT;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "conversionSnapshot" JSONB;

CREATE UNIQUE INDEX "FoodAlias_foodId_normalizedAlias_locale_key" ON "ketomentor"."FoodAlias"("foodId", "normalizedAlias", "locale");
CREATE INDEX "FoodAlias_normalizedAlias_idx" ON "ketomentor"."FoodAlias"("normalizedAlias");
CREATE INDEX "FoodAlias_normalizedAlias_trgm_idx" ON "ketomentor"."FoodAlias" USING GIN ("normalizedAlias" gin_trgm_ops);
CREATE UNIQUE INDEX "FoodServing_foodId_key_key" ON "ketomentor"."FoodServing"("foodId", "key");
CREATE INDEX "FoodServing_foodId_idx" ON "ketomentor"."FoodServing"("foodId");

ALTER TABLE "ketomentor"."FoodAlias" ADD CONSTRAINT "FoodAlias_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "ketomentor"."Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ketomentor"."FoodServing" ADD CONSTRAINT "FoodServing_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "ketomentor"."Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the six curated legacy conversions without manufacturing missing
-- values for imported foods. IDs are deterministic, making retries harmless.
INSERT INTO "ketomentor"."FoodServing" ("id", "foodId", "key", "unit", "labels", "grams", "isEstimated", "confidence", "provenance")
SELECT 'legacy:' || "id", "id", "servingUnit", "servingUnit",
       jsonb_build_object('en', "servingUnit"), "servingGrams", false, 1,
       jsonb_build_object('method', 'legacy_catalog_conversion', 'migratedAt', '2026-08-13')
FROM "ketomentor"."Food"
WHERE "servingUnit" IS NOT NULL AND "servingGrams" IS NOT NULL AND "servingGrams" > 0
ON CONFLICT ("foodId", "key") DO NOTHING;
