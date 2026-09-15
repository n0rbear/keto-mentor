CREATE TYPE "RecipeIngredientRole" AS ENUM ('core', 'seasoning', 'garnish', 'serving_accompaniment');

ALTER TABLE "RecipeIngredient"
  ALTER COLUMN "foodId" DROP NOT NULL,
  ALTER COLUMN "quantityGrams" DROP NOT NULL,
  ADD COLUMN "sourceGroup" TEXT,
  ADD COLUMN "role" "RecipeIngredientRole" NOT NULL DEFAULT 'core',
  ADD COLUMN "optional" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "includedInBaseNutrition" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "roleProvenance" JSONB;
