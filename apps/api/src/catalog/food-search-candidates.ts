import { Prisma } from "@prisma/client";

// Separate reservations prevent broad partial matches from exhausting identity
// slots. 32 covers the API's maximum 30 results plus ambiguity alternatives;
// 48 lexical + 16 fuzzy slots keep the total application pool <= 96.
//
// lexicalPrefilter (2026-09-22, revised) bounds the BROAD match itself — the
// raw FoodAlias/Food rows a common-word query like German "mit" can match
// (measured 2009 rows in staging) — BEFORE any row ever reaches a Food JOIN,
// jsonb decomposition or name normalization. A first attempt bounded a later
// stage (a per-row is_exact/cheap_rank pass over the full 2009-row join)
// instead of the broad match itself: staging EXPLAIN ANALYZE showed that
// still cost ~995ms of the ~1444ms total, because 2009 Food PK lookups +
// per-row normalize()/jsonb_array_elements calls remained, just to prove most
// rows were NOT exact. This version orders and LIMITs the raw broad
// FoodAlias/Food scan directly (cheap, scalar/index-friendly ORDER BY only:
// exact/prefix shape, confidence, id — no normalize, no jsonb) so at most
// lexicalPrefilter raw rows per side ever reach the expensive
// eligible/normalized_names/scored pipeline, matching the ~214ms read-only
// diagnostic that bounded Food/Alias at the same point. lexicalPrefilter is
// kept well above the final `lexical` budget (48) so a genuine near-exact
// candidate still has ranking headroom once the real semantic scoring
// re-sorts the smaller pool.
export const FOOD_CANDIDATE_BUDGET = {
  exact: 32, lexical: 48, fuzzy: 16, aliasesPerFood: 8,
  lexicalPrefilter: 64,
} as const;

type Policy = { forms: readonly RegExp[]; compound: RegExp };
const pgPattern = (pattern: RegExp) => pattern.source.replace(/\\b/g, "\\y");

// Same NFD/diacritic/ASCII contract as normalizeSearch, without an extension or
// a migration. Existing searchText and normalizedAlias already use that contract.
function normalized(value: Prisma.Sql) {
  return Prisma.sql`btrim(regexp_replace(lower(replace(regexp_replace(normalize(coalesce(${value}, ''), NFD), '[̀-ͯ]', '', 'g'), 'ß', 'ss')), '[^a-z0-9]+', ' ', 'g'))`;
}

function retrievalPattern(variants: readonly string[]) {
  return variants.flatMap(q => {
    if (!q.includes(" ") && q.length >= 5) return [`\\y${q}[a-z0-9]*\\y`, `\\y[a-z0-9]*${q}\\y`];
    return q.split(" ").filter(token => token.length >= 2).map(token => `\\y${token}\\y`);
  }).join("|");
}

/** One round trip for independently limited A (identity) and B (lexical).
 * Limits bound transferred rows, not PostgreSQL's scan/sort work. No servings,
 * offset pagination, user-owned food, or write statements occur here.
 */
export function foodCandidateQuery(variants: readonly string[], rankingQuery: string, policy: Policy) {
  const pattern = retrievalPattern(variants);
  const tokens = [...new Set(variants.flatMap(q => q.split(" ").filter(t => t.length >= 2)))];
  // A literal LIKE prefilter gives pg_trgm useful mandatory trigrams before
  // applying boundaries. The suffix/prefix regex alone can yield a poor bitmap.
  const aliasPrefilter = Prisma.join(tokens.map(t => Prisma.sql`a."normalizedAlias" LIKE ${`%${t}%`}`), " OR ");
  const foodPrefilter = Prisma.join(tokens.map(t => Prisma.sql`f."searchText" LIKE ${`%${t}%`}`), " OR ");
  const variantsSql = Prisma.join(variants.map((q, ordinal) => Prisma.sql`(${q}::text, ${ordinal}::int)`));
  const formPenalty = Prisma.join(policy.forms.map(form => Prisma.sql`(
    ${rankingQuery} !~ ${pgPattern(form)} AND EXISTS (SELECT 1 FROM unnest(n.names) nm WHERE nm ~ ${pgPattern(form)})
  )`), " OR ");
  const requestedForm = policy.forms.some(form => form.test(rankingQuery));
  const compoundPattern = pgPattern(policy.compound);
  const headPattern = !rankingQuery.includes(" ") ? `(^| )[^ ]+${rankingQuery}( |$)` : "a^";
  return Prisma.sql`/* food-search:identity-lexical */
    WITH variants(q, ordinal) AS (VALUES ${variantsSql}),
    -- Stage A: a dedicated, index-backed exact-alias lookup (FoodAlias_
    -- normalizedAlias_idx, btree), fully decoupled from the broad match
    -- below. Cheap and correct regardless of how broad or narrow the query
    -- is: it never scans/ranks the broad match set at all. This is the
    -- primary, guaranteed exact-identity defense; a genuine own-name-only
    -- exact match (no alias) is additionally protected below by always
    -- sorting to the top tier of the broad Food prefilter's cheap ordering
    -- (see broad_food_ids), never by a second expensive normalize() pass.
    exact_alias_ids AS (
      SELECT DISTINCT "foodId" AS id FROM ketomentor."FoodAlias" WHERE "normalizedAlias" = ${variants[0]}
    ), alias_matches AS MATERIALIZED (
      SELECT a."foodId", a."normalizedAlias", a.kind, a.confidence,
        row_number() OVER (PARTITION BY a."foodId" ORDER BY
          (a."normalizedAlias" = ${variants[0]}) DESC,
          (a."normalizedAlias" IN (SELECT q FROM variants)) DESC,
          (a.kind <> 'dynamic_search') DESC, a.confidence DESC, a.id ASC) AS rn
      FROM (
        -- Stage B: bound the RAW broad alias match itself (can be ~2000+
        -- rows for a common-word query) to lexicalPrefilter rows, using only
        -- cheap/scalar ordering (exact/prefix shape, confidence, id) BEFORE
        -- row_number/grouping ever runs on it. An exact alias is additionally
        -- guaranteed by exact_alias_ids above regardless of this ordering.
        SELECT * FROM ketomentor."FoodAlias" a
        WHERE (${aliasPrefilter}) AND a."normalizedAlias" ~ ${pattern}
        ORDER BY (a."normalizedAlias" = ${variants[0]}) DESC,
          (a."normalizedAlias" LIKE ${variants[0] + "%"}) DESC, a.confidence DESC, a.id ASC
        LIMIT ${FOOD_CANDIDATE_BUDGET.lexicalPrefilter}
      ) a
    ), aliases AS (
      SELECT "foodId", jsonb_agg(jsonb_build_object('normalizedAlias', "normalizedAlias", 'kind', kind, 'confidence', confidence) ORDER BY rn) AS entries
      FROM alias_matches WHERE rn <= ${FOOD_CANDIDATE_BUDGET.aliasesPerFood} GROUP BY "foodId"
    ), broad_food_ids AS (
      -- Stage C: same idea on the Food side. A row whose OWN name is an
      -- exact match always contains the query as a whole token in
      -- searchText, so it always sorts into this ordering's top tier —
      -- exact-by-canonical-name protection comes from THIS ordering, not
      -- from a separate expensive per-row normalize() pass.
      SELECT id FROM (
        SELECT f.id, f."searchText" FROM ketomentor."Food" f
        WHERE f."createdById" IS NULL AND (${foodPrefilter}) AND f."searchText" ~ ${pattern}
        ORDER BY (strpos(' ' || f."searchText" || ' ', ' ' || ${variants[0]} || ' ') > 0) DESC,
          (f."searchText" LIKE ${variants[0] + "%"}) DESC, f.id ASC
        LIMIT ${FOOD_CANDIDATE_BUDGET.lexicalPrefilter}
      ) ranked
    ), candidate_ids AS MATERIALIZED (
      -- Stage D: the ONLY set the expensive pipeline below ever sees — an
      -- indexed-exact handful plus at most 2 * lexicalPrefilter bounded
      -- broad rows, deduplicated. Never the raw broad match's full size.
      SELECT id FROM exact_alias_ids
      UNION SELECT id FROM broad_food_ids
      UNION SELECT "foodId" AS id FROM aliases
    ), eligible AS (
      SELECT f.id, f.name, f."originalName", f.names AS localized, f."searchText", f.source, f."sourceId",
        f."kcalPer100g", f."proteinPer100g", f."fatPer100g", f."carbsPer100g",
        coalesce(a.entries, '[]'::jsonb) AS "_aliases",
        ARRAY(SELECT DISTINCT value #>> '{}' FROM jsonb_array_elements(
          jsonb_build_array(f.name, f."originalName") ||
          CASE WHEN jsonb_typeof(f.names) = 'object' THEN jsonb_path_query_array(f.names, '$.*') ELSE '[]'::jsonb END
        ) value WHERE jsonb_typeof(value) = 'string') AS raw_names
      FROM candidate_ids ids JOIN ketomentor."Food" f ON f.id = ids.id
      LEFT JOIN aliases a ON a."foodId" = f.id WHERE f."createdById" IS NULL
    ), normalized_names AS MATERIALIZED (
      SELECT e.*, ARRAY(SELECT ${normalized(Prisma.sql`nm`)} FROM unnest(e.raw_names) nm) AS names FROM eligible e
    ), scored AS MATERIALIZED (
      SELECT n.id, n.name, n."originalName", n.localized, n."searchText", n.source, n."sourceId",
        n."kcalPer100g", n."proteinPer100g", n."fatPer100g", n."carbsPer100g", n."_aliases", s.score,
        (CASE WHEN (${formPenalty}) OR (${requestedForm} AND EXISTS (
          SELECT 1 FROM unnest(n.names) nm WHERE nm ~ ${"\\y(raw|fresh|roh|frisch|nyers|friss)\\y"}
        )) THEN 30 ELSE 0 END
        + CASE WHEN ${rankingQuery} !~ ${compoundPattern} AND (
          (n.source::text = 'bls' AND n."sourceId" ~ '^[DXY][A-Z0-9]{6}$' AND NOT (${rankingQuery} = ANY(n.names))) OR
          EXISTS (SELECT 1 FROM unnest(n.names) nm WHERE nm ~ ${compoundPattern}) OR
          EXISTS (SELECT 1 FROM unnest(n.raw_names) nm WHERE
            ${normalized(Prisma.sql`regexp_replace(nm, '[-–—]', ' hyphenboundary ', 'g')`)} ~ ${`(^| )${rankingQuery} hyphenboundary `})
        ) THEN 40 ELSE 0 END
        + CASE WHEN EXISTS (SELECT 1 FROM unnest(n.names) nm WHERE nm ~ ${headPattern}) THEN 20 ELSE 0 END) AS penalty
      FROM normalized_names n CROSS JOIN LATERAL (
        SELECT max(CASE WHEN v.ordinal > 0 THEN least(base.score, 55) ELSE base.score END) AS score
        FROM variants v CROSS JOIN LATERAL (
          SELECT CASE
            WHEN v.q = ANY(n.names) THEN 100
            WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(n."_aliases") a WHERE a->>'normalizedAlias' = v.q) THEN
              CASE WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(n."_aliases") a WHERE a->>'normalizedAlias' = v.q AND (
                a->>'kind' <> 'dynamic_search' OR ((a->>'confidence')::float >= 0.9 AND NOT EXISTS (
                  SELECT 1 FROM unnest(string_to_array(v.q, ' ')) t WHERE length(t) >= 2 AND NOT EXISTS (
                    SELECT 1 FROM unnest(n.names) nm WHERE strpos(nm, t) > 0
                  )
                ))
              )) THEN 95 ELSE 35 END
            WHEN EXISTS (SELECT 1 FROM unnest(n.names) nm WHERE starts_with(nm, v.q || ' ')) THEN 80
            WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(n."_aliases") a WHERE starts_with(a->>'normalizedAlias', v.q || ' ')) THEN 75
            WHEN strpos(' ' || n."searchText" || ' ', ' ' || v.q || ' ') > 0 THEN 70
            WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(n."_aliases") a WHERE strpos(' ' || (a->>'normalizedAlias') || ' ', ' ' || v.q || ' ') > 0) THEN 65
            WHEN length(v.q) >= 5 AND strpos(v.q, ' ') = 0 AND EXISTS (
              SELECT 1 FROM unnest(string_to_array(n."searchText", ' ')) t WHERE length(t) >= 5 AND (right(t, length(v.q)) = v.q OR right(v.q, length(t)) = t)
            ) THEN 60
            WHEN length(v.q) >= 5 AND strpos(v.q, ' ') = 0 AND EXISTS (
              SELECT 1 FROM unnest(string_to_array(n."searchText", ' ')) t WHERE starts_with(t, v.q)
            ) THEN 40
            ELSE round(50.0 * (SELECT count(*) FROM unnest(string_to_array(v.q, ' ')) t
              WHERE strpos(' ' || n."searchText" || ' ', ' ' || t || ' ') > 0) / cardinality(string_to_array(v.q, ' ')))::int
          END AS score
        ) base
      ) s
    ), identities AS (
      SELECT * FROM scored WHERE score >= 95 ORDER BY score - penalty DESC, penalty ASC, name ASC, id ASC LIMIT ${FOOD_CANDIDATE_BUDGET.exact}
    ), lexical AS (
      SELECT * FROM scored WHERE score < 95 AND score > 0 ORDER BY greatest(1, score - penalty) DESC, penalty ASC, name ASC, id ASC LIMIT ${FOOD_CANDIDATE_BUDGET.lexical}
    )
    SELECT id, name, "originalName", localized AS names, "searchText", source, "sourceId",
      "kcalPer100g", "proteinPer100g", "fatPer100g", "carbsPer100g", "_aliases"
    FROM (SELECT * FROM identities UNION ALL SELECT * FROM lexical) candidates
    ORDER BY score - penalty DESC, penalty ASC, name ASC, id ASC`;
}

export function fuzzyCandidateQuery(query: string, excludedIds: readonly string[]) {
  const exclusion = excludedIds.length ? Prisma.sql`AND id NOT IN (${Prisma.join(excludedIds)})` : Prisma.empty;
  return Prisma.sql`/* food-search:fuzzy */
    SELECT id, name, "originalName", names, "searchText", source, "sourceId",
      "kcalPer100g", "proteinPer100g", "fatPer100g", "carbsPer100g", '[]'::jsonb AS "_aliases"
    FROM ketomentor."Food" WHERE "createdById" IS NULL AND "searchText" % ${query}
      ${exclusion}
      AND NOT (strpos("searchText", ${query}) > 0 AND strpos(' ' || "searchText" || ' ', ' ' || ${query} || ' ') = 0)
    ORDER BY similarity("searchText", ${query}) DESC, id ASC LIMIT ${FOOD_CANDIDATE_BUDGET.fuzzy}`;
}
