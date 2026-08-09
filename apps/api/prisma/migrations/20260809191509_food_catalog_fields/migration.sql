-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "names" JSONB,
ADD COLUMN     "servingGrams" DOUBLE PRECISION,
ADD COLUMN     "servingUnit" TEXT,
ADD COLUMN     "synonyms" JSONB;

-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food"("name");

-- CreateIndex
CREATE INDEX "Food_barcode_idx" ON "Food"("barcode");
