-- Additive catalog metadata. Existing foods and meal references are preserved.
ALTER TABLE "Food"
ADD COLUMN "sourceId" TEXT,
ADD COLUMN "originalName" TEXT,
ADD COLUMN "category" TEXT,
ADD COLUMN "searchText" TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX "Food_source_sourceId_key" ON "Food"("source", "sourceId");

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE INDEX "Food_searchText_trgm_idx" ON "Food" USING GIN ("searchText" gin_trgm_ops);

UPDATE "Food"
SET "searchText" = unaccent(lower(concat_ws(' ', "name", "names"::text, "synonyms"::text, coalesce("brand", ''))));
