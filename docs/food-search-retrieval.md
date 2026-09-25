# Food search: bounded retrieval and read-only audit (2026-09-22)

## Status

Local implementation only. Branch `fix/web-evidence-production-effectiveness`, unchanged HEAD `c2f652a8c8a1933b11506bc817c8eaf8ad7df5d1`. No commit, push, deploy, migration, seed, alias mutation or catalog:coverage run.

The unbounded transfer/SQL-count problem is fixed. This is **not yet a blanket performance sign-off**: the broad `mit` control still takes 2.24 s warm, and some ordinary searches measured slower than the historical baseline. Do not infer 100k readiness from bounded network payload.

## Retrieval contract

- A and B execute in **one parameterized SQL statement**, with independent reservations: **32 identity + 48 lexical**.
- A: normalized own/localized name or trusted exact alias, original query only. Expansions cannot become trusted identity.
- B: whole tokens, phrase/token coverage, long (>=5) prefixes/compound heads and reviewed expansions. A literal LIKE prefilter uses existing pg_trgm indexes; boundary checks reject short incidental substrings. The ID union avoids an OR across the Food/Alias join forcing a full Food scan on selective queries.
- C: **16 fuzzy** candidates, only for >=3-character queries when no candidate scores >=40. It excludes existing IDs and substring-only noise. Two-character queries keep A/B, not fuzzy.
- Maximum application ranking pool: **96 distinct compact Food rows**. At most 8 relevant alias evidence entries per A/B food; no standalone unbounded alias download.
- Why 32/48/16: API output is capped at 30; identity reservation can retain the full output plus alternatives. 48 lexical rows allow reranking beyond the output limit (the real 79 relevant Quark records reduce to 48 while all five plain variants survive); fuzzy has a deliberately smaller, lower-trust budget.
- More than 32 equally strong exact identities or 48 comparable lexical alternatives can still be truncated. This is bounded retrieval, not an exhaustive catalog enumeration.
- Full Food + servings are fetched **once, by final winner IDs**, at most 30 foods. Prisma currently emits one Food and one FoodServing SQL for this include; no per-page serving queries.
- Runtime DB calls: 1 discovery + optional 1 fuzzy + optional 1 hydration = **1–3 application calls / 1–4 actual SQL statements**. No offset pagination or application-level N+1.
- The existing minimal non-SQL projected/test adapters keep a separate bounded compatibility path (96 direct foods, 96 aliases, at most 96 related foods). Real Prisma clients/transactions use the SQL path; adapter-only unit results are not evidence of SQL behavior.

Limits bound application materialization and round trips, **not DB work**. PostgreSQL can still scan Food/Alias and rank many matches before applying LIMIT. Alias evidence uses a window sort; worst-case server complexity includes O(A log A) sorting and O(F) lexical/normalization work. Names are deduplicated before normalization; identity is derived from the already-computed score to avoid evaluating the score twice.

## Semantic preservation and additional real-data regressions

The prior bacon→ham removal, word-boundary rules, original form evidence, trust/ambiguity and semantic-before-source ordering remain. No searched ingredient is hardcoded.

Real-data validation exposed compound shapes missing from the earlier fixtures:
- a hyphenated ingredient inside a parenthesized preparation;
- productive German prepared-food heads (cakes/pastry/dough);
- publisher-classified preparations whose names alone are insufficient.

BLS D is cakes/pastry; X/Y are menu components. This is **preparation metadata**, not a blanket BLS source preference. Exact named dishes retain identity. Reference: [BLS category taxonomy](https://blsdb.de/category?catId=top), [BLS key system](https://blsdb.de/bls).

Live top results:
- bacon: USDA pork bacon, weak score 35; no Hamburger/Hammel.
- Schmand: plain Sauerrahm/Schmand >=20% fat before dip.
- quark: five plain Speisequark fat variants first; fat-level ambiguity remains (not automatically resolved).
- Petersilie: raw leaf first, dried not first; root remains a separate candidate/identity.
- Ei: exact Egg first.
- Öl: **no exact own/localized name or alias in staging**. 55 BLS fats/oils-group rows exist, but short boundary search does not invent that mapping. Actual results are foods preserved in oil, not a correct generic oil identity. Exact Öl is proven by the SQL fixture, not by these live results. No alias was added.
- ch: zero candidates/results.

## Verification

- Reproducing tests ran red before corresponding fixes.
- Targeted: **4 files, 111/111 tests**.
- Full API: **95 files, 1920/1920 tests**.
- API typecheck (`npm run lint -w apps/api`), build (`prisma generate && tsc`) and `git diff --check`: PASS. No server/bootstrap/migration/seed was run.
- **15/15 actual PostgreSQL read-only fixture checks** using JSON-to-recordset CTEs (no tables created or modified): exact name after 190 weak records, exact alias after 130 aliases, 120-compound cutoffs, preparation/source comparisons, exact Ei/Öl, 8202 irrelevant ch rows, explicit dish/form preservation.
- Unit SQL-contract mocks prove orchestration, not PostgreSQL execution; the separate fixture checks exercise the generated SQL itself.

## Measurement method and results

Guard rechecked: `keto_mentor_staging_db`, schema `ketomentor`, BLS=7090. Public Food=7231, all FoodAlias=7540.

Measured the **local changed searchFoods**, not the old deployed API. External TLS, one READ ONLY transaction per search, no API bootstrap. SQL counts exclude BEGIN/SET/COMMIT and identity guards. First + five warm runs, warm median. “First” is not a flushed-cache benchmark. Shared staging/network/load variance remains; previous medians are historical, not a simultaneous randomized A/B experiment. A separate read-only fixture check overlapped the tail of this run, so broad-query latency is a diagnostic measurement, not an isolated-load SLA. Subsequent serial EXPLAIN measurements independently confirm the DB bottleneck.

All times ms. Download columns: compact candidates / embedded alias entries, then full Food / serving rows. Embedded JSON aliases are evidence records, not separate SQL result rows.

| Query | Old warm | New first | New warm median | App/SQL | Compact/alias | Full/servings | Results |
|---|---:|---:|---:|---:|---:|---:|---:|
| bacon | 104.55 | 519.04 | 192.50 | 3/4 | 2/3 | 2/0 | 2 |
| Schmand | 237.48 | 305.34 | 134.32 | 2/3 | 4/4 | 4/0 | 4 |
| quark | 182.34 | 318.50 | 194.83 | 2/3 | 48/48 | 20/0 | 20 |
| Petersilie | 117.75 | 285.73 | 169.13 | 2/3 | 16/16 | 16/0 | 16 |
| Butter | 326.26 | 219.40 | 198.11 | 2/3 | 49/50 | 20/2 | 20 |
| tejföl | 93.10 | 208.35 | 117.44 | 2/3 | 1/2 | 1/0 | 1 |
| Ei | — | 668.06 | 377.80 | 2/3 | 33/33 | 20/1 | 20 |
| Öl | — | 649.75 | 303.85 | 2/3 | 35/35 | 20/0 | 20 |
| ch | 21477.86 | 190.80 | 249.58 | 1/1 | 0/0 | 0/0 | 0 |
| zzqxnotfound | 76.21 | 330.87 | 160.87 | 2/2 | 0/0 | 0/0 | 0 |
| mit | — | 1934.64 | 2241.15 | 2/3 | 48/48 | 20/0 | 20 |

Old ch: 21,477.86 ms, 161 SQL, 8,202 Food/Alias records, 0 results. New: 249.58 ms, **1 SQL, 0 downloaded records, 0 results**. No timing claim should be generalized beyond this measured environment.

Normal queries do not uniformly improve: Schmand/Butter improve, Quark is close, bacon/Petersilie/tejföl and the absent query are slower in the final run. Historical-vs-current timing alone cannot attribute all of that to code, but the “no significant regression” acceptance condition is not established.

## 7k / 15k / 100k assessment

Existing indexes verified: Food_searchText_trgm_idx, FoodAlias_normalizedAlias_trgm_idx, alias normalized-name B-tree and primary keys. No index was added.

Serial final EXPLAIN ANALYZE, three samples each, execution only:
- ch: 170.785 / 79.113 / 28.062 ms; median **79.113 ms**; scans all 7540 aliases and 7233 foods (including ownership filtering), returns zero.
- quark: 74.183 / 25.280 / 18.553 ms; median **25.280 ms**.
- mit: 1445.010 / 1577.787 / 1898.742 ms; median **1577.787 ms**.

First-order estimates, **not measurements**: same match density, alias/food ratio, hardware and load; scale DB execution by N/7231 and hold the observed non-DB remainder constant. Sort growth/cache/parallel load can make these optimistic.

| Query class | 15k estimated total | 100k estimated total |
|---|---:|---:|
| Selective Quark-like | ~0.22 s | ~0.52 s |
| Short ch-like scan | ~0.33 s | ~1.26 s |
| Broad mit-like | ~3.94 s | ~22.48 s |

Application calls and downloaded candidate limits stay constant at either size. DB CPU does not.

Verdict: the requested everyday cases are bounded at the current 7090 BLS size, but the 2.24 s broad-token result remains a performance concern. 15k needs a broad-query improvement; 100k needs query/index redesign and realistic load testing. **Not yet recommended as a finished performance fix for commit/release.**

Next options (not implemented):
1. Cheaper DB pre-ranking before expensive per-candidate semantic expressions, retaining the separate exact reservation and testing cutoff recall.
2. Reviewed indexed normalized-name/token representation to avoid broad short-token scans (would need separately authorized schema/data work).
3. Same-environment randomized old/new comparison plus Render-internal load testing to distinguish network/load variance from ordinary-query regression.

No production access or state mutation occurred during this audit.
