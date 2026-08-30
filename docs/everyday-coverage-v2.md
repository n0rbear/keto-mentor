# Everyday Coverage v2

This increment improves ordinary Hungarian, German and English ingredient search without importing the full publisher catalogs. It is a reviewed overlay of exact publisher identities and localized aliases. It does not add fuzzy identity binding, browser-shipped manifest data, external search calls, or a schema migration.

## Scope and source binding

- 106 source-bound entries covering 106 food concepts: 81 European Essentials identities reused for better aliases and 25 concepts beyond the original 100-food set.
- 101 exact BLS 4.0 identities.
- 4 exact USDA SR Legacy 2018-04 identities.
- 1 exact USDA Foundation Foods 2026-04-30 identity: red onion FDC `790577`, already present in production and updated rather than duplicated.
- 401 locale-specific alias rows after per-food/per-locale normalization: 139 HU, 125 DE and 137 EN.
- 244 reviewed search cases across 109 expected concepts, including high-carb controls and four deliberately generic ambiguity cases.

Every raw-data selection is by exact source ID. The adapter also requires the reviewed tokens to occur in the normalized publisher name. A missing ID or changed name fails explicitly; no nearby record or cross-source name match is substituted. Nutrition remains sourced from the publisher files and is never copied into the manifest.

## Measured coverage

The production baseline was evaluated read-only with the application ranking rules. A non-empty result counted as a failure when its top identity was wrong.

| Classification | Before | Projected after guarded import |
|---|---:|---:|
| Exact or alias pass | 20 | 240 |
| Partial or fuzzy pass | 44 | 0 |
| Ambiguous | 16 | 4 |
| Wrong top result | 38 | 0 |
| Missing | 126 | 0 |
| Pass rate | 26.2% | 98.4% |

The projected result combines all 240 source-bound cases passing the exact alias/name audit with the four intentionally generic production cases (`sajt`, `Käse`, `fish`, `bread`) remaining ambiguous. No ambiguity rule was weakened.

Initial failures grouped as: 49 queries with a missing identity, 85 with an existing identity but missing localized alias, 30 ranking/wrong-top failures, 16 genuine ambiguities and 0 provenance failures.

## Read-only production dry-run

The command was run against an exact read-only snapshot of the `ketomentor` production catalog and the official BLS, SR Legacy and Foundation files:

- 106 input / 106 valid / 0 skipped / 0 duplicates.
- 19 foods to create and 87 exact identities to update.
- 3,191 expected FoodNutrient upserts and 0 new nutrient definitions.
- 487,460 bytes (about 476 KiB) conservative estimated growth, including alias rows and indexes.
- 240/240 source-bound must-find cases passed.

Before and after the dry-run, production remained exactly 978 Food rows, 24,843 FoodNutrient rows, 53 FoodAlias rows and 6,307,840 catalog bytes. Therefore the dry-run made no production writes.

## Guarded command

Raw publisher files stay outside Git. Dry-run is the default:

```bash
npm run catalog:coverage -w apps/api -- \
  --bls /data/BLS_4_0_Daten_2025_DE.xlsx \
  --usda-sr /data/FoodData_Central_sr_legacy_food_csv_2018-04 \
  --usda-foundation /data/FoodData_Central_foundation_food_csv_2026-04-30 \
  --batch-size 75
```

Write mode requires both guards:

```bash
npm run catalog:coverage -w apps/api -- \
  --bls /data/BLS_4_0_Daten_2025_DE.xlsx \
  --usda-sr /data/FoodData_Central_sr_legacy_food_csv_2018-04 \
  --usda-foundation /data/FoodData_Central_foundation_food_csv_2026-04-30 \
  --batch-size 75 --apply --confirm everyday-coverage-v2
```

Production write has **not** occurred. The command is not referenced by normal seed, start, or Render postdeploy scripts. A separate approval and a fresh dry-run are required before any later apply operation.

## Search safety

Normal `GET /foods` remains local-database only. Alias lookup is capped at 60 rows, normal Food lookup at 90, final results at 30 and trigram fallback at 60. Alias upserts happen inside the existing per-food transaction, so no request-time N+1 behavior or per-keystroke external call was added.

Read-only production `EXPLAIN ANALYZE` checks on the current 978-food catalog measured 0.111 ms for the bounded alias path, 0.370 ms for the bounded Food path and 0.459 ms for the indexed bounded trigram fallback. The proposed growth does not justify a new index migration.
