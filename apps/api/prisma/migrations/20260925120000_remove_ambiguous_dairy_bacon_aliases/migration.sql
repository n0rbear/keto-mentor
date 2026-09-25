-- Forward-only data cleanup (owner-approved 2026-09-25). Earlier catalog
-- imports gave two BLS records confident names for ambiguous bare words:
--   * M713100 Speisequark MAGERSTUFE (66 kcal): "túró"/"turo" (hu), "Quark"
--     (de), "quark" (en). Bare túró/Quark also covers 20 % / 40 % Fett i. Tr.
--     products at roughly double the energy.
--   * W415000 Frühstücksspeck (304 kcal): "szalonna" (hu). Bare szalonna also
--     covers back fat at 699-746 kcal.
-- The manifests no longer carry these words, but the importers only upsert,
-- so the rows they left behind need removing here. Scope is deliberately
-- narrow: only these two catalog records, only these exact words, and only
-- aliases the curated importers wrote. User-confirmed and learned aliases
-- (confirmed_external, dynamic_search) are left untouched. Qualified names
-- (sovány túró, Magerquark, szemcsés túró, bacon, Frühstücksspeck) stay.
-- Every statement is a no-op on a database that never had the old rows.

DELETE FROM "ketomentor"."FoodAlias" AS a
USING "ketomentor"."Food" AS f
WHERE a."foodId" = f."id"
  AND f."source" = 'bls'
  AND f."createdById" IS NULL
  AND a."provenance"->>'method' IN ('curated_import', 'everyday_coverage_alias_overlay')
  AND (
    (f."sourceId" = 'M713100' AND a."locale" = 'hu' AND a."normalizedAlias" = 'turo')
    OR (f."sourceId" = 'M713100' AND a."locale" IN ('de', 'en') AND a."normalizedAlias" = 'quark')
    OR (f."sourceId" = 'W415000' AND a."locale" = 'hu' AND a."normalizedAlias" = 'szalonna')
  );

-- Search treats every value in Food.names as the food's own name (an exact
-- match earns full trust), so the old display names must go too, not just
-- the alias rows. Replace them with the qualified names the manifests now
-- use, so the row reads the same as after a fresh re-import.
UPDATE "ketomentor"."Food"
SET "names" = jsonb_set("names", '{hu}', '"sovány túró"')
WHERE "source" = 'bls' AND "sourceId" = 'M713100' AND "createdById" IS NULL
  AND "names"->>'hu' IN ('túró', 'turo');

UPDATE "ketomentor"."Food"
SET "names" = jsonb_set("names", '{de}', '"Magerquark"')
WHERE "source" = 'bls' AND "sourceId" = 'M713100' AND "createdById" IS NULL
  AND "names"->>'de' = 'Quark';

UPDATE "ketomentor"."Food"
SET "names" = jsonb_set("names", '{en}', '"low-fat quark"')
WHERE "source" = 'bls' AND "sourceId" = 'M713100' AND "createdById" IS NULL
  AND "names"->>'en' = 'quark';

-- Food.synonyms feeds re-imports and searchText; drop the same bare words
-- from each locale's list so a later re-import cannot resurrect them.
UPDATE "ketomentor"."Food" AS f
SET "synonyms" = (
  SELECT jsonb_object_agg(
    s.key,
    CASE
      WHEN jsonb_typeof(s.value) <> 'array' THEN s.value
      ELSE COALESCE((
        SELECT jsonb_agg(v.value ORDER BY v.ordinality)
        FROM jsonb_array_elements(s.value) WITH ORDINALITY AS v(value, ordinality)
        WHERE NOT (
          (f."sourceId" = 'M713100' AND s.key = 'hu' AND v.value #>> '{}' IN ('túró', 'turo'))
          OR (f."sourceId" = 'M713100' AND s.key = 'de' AND v.value #>> '{}' = 'Quark')
          OR (f."sourceId" = 'M713100' AND s.key = 'en' AND v.value #>> '{}' = 'quark')
          OR (f."sourceId" = 'W415000' AND s.key = 'hu' AND v.value #>> '{}' = 'szalonna')
        )
      ), '[]'::jsonb)
    END
  )
  FROM jsonb_each(f."synonyms") AS s
)
WHERE f."source" = 'bls' AND f."sourceId" IN ('M713100', 'W415000') AND f."createdById" IS NULL
  AND jsonb_typeof(f."synonyms") = 'object'
  AND f."synonyms" <> '{}'::jsonb;
