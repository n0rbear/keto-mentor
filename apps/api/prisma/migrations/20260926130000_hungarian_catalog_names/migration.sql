-- Hungarian catalog names (owner-approved 2026-09-26, roadmap A2 + A5).
-- Scope: named catalog records only (source + sourceId), createdById NULL.
-- Every statement is idempotent and a no-op where the record is absent.
--
-- A2  Wrong names:
--   * USDA 170918 caraway seed was named "Körömfűmag" -> "kömény".
--   * USDA 2747674 turnip was named "fehérrépa". In Hungarian cooking
--     "fehérrépa" means parsley root, a different food, so the turnip is
--     renamed "tarlórépa" and the learned "feherrepa" alias is removed.
--   * Bare "tejföl" pointed at BLS M172500 (10 % fat). Hungarian tejföl is
--     usually 20 %: the 10 % record becomes "tejföl (10%)" and bare
--     "tejföl" moves to USDA 2346387 (full-fat sour cream, 18 % fat).
-- A5  Missing Hungarian names for records the reference dishes use
--     (virsli, babérlevél, marhalábszár, ponty, karalábé, sertéskaraj,
--     őrölt pirospaprika, TV paprika).

-- 1. Remove the wrong bare words first.
DELETE FROM "ketomentor"."FoodAlias" AS a
USING "ketomentor"."Food" AS f
WHERE a."foodId" = f."id" AND f."createdById" IS NULL AND a."locale" = 'hu'
  AND (
    (f."source" = 'usda_fdc' AND f."sourceId" = '2747674' AND a."normalizedAlias" = 'feherrepa')
    OR (f."source" = 'bls' AND f."sourceId" = 'M172500' AND a."normalizedAlias" = 'tejfol')
  );

-- 2. Hungarian display names (Food.names.hu counts as the food's own name).
UPDATE "ketomentor"."Food" AS f
SET "names" = jsonb_set(COALESCE(f."names", '{}'::jsonb), '{hu}', to_jsonb(v.hu))
FROM (VALUES
  ('usda_fdc', '170918', 'kömény'),
  ('usda_fdc', '2747674', 'nyers tarlórépa'),
  ('bls', 'M172500', 'tejföl (10%)'),
  ('usda_fdc', '2346387', 'tejföl (20%)'),
  ('bls', 'W211200', 'virsli'),
  ('usda_fdc', '170917', 'babérlevél'),
  ('usda_fdc', '169441', 'marhalábszár'),
  ('bls', 'T501100', 'ponty'),
  ('bls', 'G331100', 'karalábé'),
  ('bls', 'U622100', 'sertéskaraj'),
  ('usda_fdc', '171329', 'őrölt pirospaprika'),
  ('usda_fdc', '2747660', 'TV paprika')
) AS v(source, source_id, hu)
WHERE f."source"::text = v.source AND f."sourceId" = v.source_id AND f."createdById" IS NULL
  AND COALESCE(f."names"->>'hu', '') <> v.hu;

-- The 10 % record keeps only qualified Hungarian synonyms, so a re-built
-- searchText cannot bring bare "tejföl" back.
UPDATE "ketomentor"."Food"
SET "synonyms" = jsonb_set("synonyms", '{hu}', '["tejföl 10%", "tejfol 10%"]'::jsonb)
WHERE "source" = 'bls' AND "sourceId" = 'M172500' AND "createdById" IS NULL
  AND "synonyms" ? 'hu' AND "synonyms"->'hu' <> '["tejföl 10%", "tejfol 10%"]'::jsonb;

-- 3. Reviewed aliases.
INSERT INTO "ketomentor"."FoodAlias" ("id", "foodId", "alias", "normalizedAlias", "locale", "kind", "confidence", "provenance")
SELECT 'reviewed_' || md5(f."id" || '|' || v.normalized || '|hu'), f."id", v.alias, v.normalized, 'hu', v.kind, 1,
       '{"method": "reviewed_migration", "approvedBy": "owner", "approvedAt": "2026-09-26", "roadmap": "A2/A5"}'::jsonb
FROM (VALUES
  ('usda_fdc', '170918', 'kömény', 'komeny', 'localized_name'),
  ('usda_fdc', '170918', 'köménymag', 'komenymag', 'synonym'),
  ('usda_fdc', '2747674', 'tarlórépa', 'tarlorepa', 'localized_name'),
  ('bls', 'M172500', 'tejföl 10%', 'tejfol 10', 'localized_name'),
  ('usda_fdc', '2346387', 'tejföl', 'tejfol', 'localized_name'),
  ('usda_fdc', '2346387', 'tejföl 20%', 'tejfol 20', 'synonym'),
  ('bls', 'W211200', 'virsli', 'virsli', 'localized_name'),
  ('bls', 'W211200', 'bécsi virsli', 'becsi virsli', 'synonym'),
  ('usda_fdc', '170917', 'babérlevél', 'baberlevel', 'localized_name'),
  ('usda_fdc', '170917', 'babér', 'baber', 'synonym'),
  ('usda_fdc', '169441', 'marhalábszár', 'marhalabszar', 'localized_name'),
  ('usda_fdc', '169441', 'marha lábszár', 'marha labszar', 'synonym'),
  ('bls', 'T501100', 'ponty', 'ponty', 'localized_name'),
  ('bls', 'G331100', 'karalábé', 'karalabe', 'localized_name'),
  ('bls', 'U622100', 'sertéskaraj', 'serteskaraj', 'localized_name'),
  ('bls', 'U622100', 'karaj', 'karaj', 'synonym'),
  ('usda_fdc', '171329', 'őrölt pirospaprika', 'orolt pirospaprika', 'localized_name'),
  ('usda_fdc', '171329', 'pirospaprika', 'pirospaprika', 'synonym'),
  ('usda_fdc', '171329', 'fűszerpaprika', 'fuszerpaprika', 'synonym'),
  ('usda_fdc', '171329', 'őrölt paprika', 'orolt paprika', 'synonym'),
  ('usda_fdc', '2747660', 'TV paprika', 'tv paprika', 'localized_name')
) AS v(source, source_id, alias, normalized, kind)
JOIN "ketomentor"."Food" AS f ON f."source"::text = v.source AND f."sourceId" = v.source_id AND f."createdById" IS NULL
ON CONFLICT ("foodId", "normalizedAlias", "locale") DO NOTHING;

-- 4. searchText: drop the wrong words, append the new ones once.
UPDATE "ketomentor"."Food"
SET "searchText" = regexp_replace("searchText", '\mkoromfumag\M', 'komeny komenymag', 'g')
WHERE "source" = 'usda_fdc' AND "sourceId" = '170918' AND "createdById" IS NULL AND "searchText" ~ '\mkoromfumag\M';

UPDATE "ketomentor"."Food"
SET "searchText" = regexp_replace("searchText", '\mfeherrepa\M', 'tarlorepa', 'g')
WHERE "source" = 'usda_fdc' AND "sourceId" = '2747674' AND "createdById" IS NULL AND "searchText" ~ '\mfeherrepa\M';

UPDATE "ketomentor"."Food"
SET "searchText" = regexp_replace("searchText", '\mtejfol\M(?! 10)', 'tejfol 10', 'g')
WHERE "source" = 'bls' AND "sourceId" = 'M172500' AND "createdById" IS NULL AND "searchText" ~ '\mtejfol\M(?! 10)';

UPDATE "ketomentor"."Food" AS f
SET "searchText" = f."searchText" || ' ' || v.words
FROM (VALUES
  ('usda_fdc', '2346387', 'tejfol 20 tejfol'),
  ('bls', 'W211200', 'virsli becsi virsli'),
  ('usda_fdc', '170917', 'baberlevel baber'),
  ('usda_fdc', '169441', 'marhalabszar marha labszar'),
  ('bls', 'T501100', 'ponty'),
  ('bls', 'G331100', 'karalabe'),
  ('bls', 'U622100', 'serteskaraj karaj'),
  ('usda_fdc', '171329', 'orolt pirospaprika fuszerpaprika orolt paprika'),
  ('usda_fdc', '2747660', 'tv paprika')
) AS v(source, source_id, words)
WHERE f."source"::text = v.source AND f."sourceId" = v.source_id AND f."createdById" IS NULL
  AND position(v.words IN f."searchText") = 0;
