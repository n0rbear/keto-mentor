CREATE TYPE "ketomentor"."RecipeVisibility" AS ENUM ('private', 'public', 'unlisted');
CREATE TYPE "ketomentor"."RecipeSourceType" AS ENUM ('manual', 'schema_org', 'ai_structured');

CREATE TABLE "ketomentor"."Recipe" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "servings" DOUBLE PRECISION,
  "finishedWeightGrams" DOUBLE PRECISION,
  "visibility" "ketomentor"."RecipeVisibility" NOT NULL DEFAULT 'private',
  "sourceType" "ketomentor"."RecipeSourceType" NOT NULL DEFAULT 'manual',
  "sourceUrl" TEXT,
  "provenance" JSONB,
  "forkedFromRecipeId" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ketomentor"."RecipeIngredient" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "quantityGrams" DOUBLE PRECISION NOT NULL,
  "originalText" TEXT,
  "preparation" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ketomentor"."MealItem" ALTER COLUMN "foodId" DROP NOT NULL;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "recipeId" TEXT;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "displayName" TEXT;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "snapshotKcal" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "snapshotFat" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "snapshotProtein" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "snapshotCarbs" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "snapshotFiber" DOUBLE PRECISION;
ALTER TABLE "ketomentor"."MealItem" ADD COLUMN "snapshotNutrients" JSONB;

-- Existing production MealItems are Food-backed. Add without an initial table
-- rewrite, then validate the audited rows before the migration completes.
ALTER TABLE "ketomentor"."MealItem" ADD CONSTRAINT "MealItem_exactly_one_source_check"
  CHECK (("foodId" IS NOT NULL AND "recipeId" IS NULL) OR ("foodId" IS NULL AND "recipeId" IS NOT NULL)) NOT VALID;
ALTER TABLE "ketomentor"."MealItem" VALIDATE CONSTRAINT "MealItem_exactly_one_source_check";

CREATE INDEX "Recipe_userId_deletedAt_idx" ON "ketomentor"."Recipe"("userId", "deletedAt");
CREATE INDEX "Recipe_visibility_deletedAt_createdAt_idx" ON "ketomentor"."Recipe"("visibility", "deletedAt", "createdAt");
CREATE INDEX "Recipe_title_idx" ON "ketomentor"."Recipe"("title");
CREATE INDEX "RecipeIngredient_recipeId_sortOrder_idx" ON "ketomentor"."RecipeIngredient"("recipeId", "sortOrder");
CREATE INDEX "RecipeIngredient_foodId_idx" ON "ketomentor"."RecipeIngredient"("foodId");
CREATE INDEX "MealItem_recipeId_idx" ON "ketomentor"."MealItem"("recipeId");

ALTER TABLE "ketomentor"."Recipe" ADD CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ketomentor"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ketomentor"."Recipe" ADD CONSTRAINT "Recipe_forkedFromRecipeId_fkey" FOREIGN KEY ("forkedFromRecipeId") REFERENCES "ketomentor"."Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ketomentor"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "ketomentor"."Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ketomentor"."RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "ketomentor"."Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ketomentor"."MealItem" ADD CONSTRAINT "MealItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "ketomentor"."Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
