# Everyday Coverage v2

This increment improves ordinary Hungarian, German and English ingredient search without importing the full publisher catalogs. It is a reviewed set of exact publisher identities plus an explicit search-alias overlay. It does not add fuzzy identity binding, browser-shipped manifest data, external search calls, a schema migration, or a cross-source Food merge.

## Source binding and alias policy

- 106 exact source-bound entries: 81 reused European Essentials identities and 25 additional concepts.
- 101 BLS 4.0, 4 USDA SR Legacy 2018-04 and 1 USDA Foundation Foods 2026-04-30 identity.
- Red onion remains bound to USDA Foundation FDC `790577`.
- 240 source-bound corpus terms are represented by their reviewed manifest entry. This is source-binding evidence only; it is not the final search metric.
- Generic aliases for egg, avocado, butter, spinach, cucumber, cheddar and gouda target the stable starter Foods `catalog-egg`, `catalog-avocado`, `catalog-butter`, `catalog-spinach`, `catalog-cucumber`, `catalog-cheddar` and `catalog-gouda`.
- The remaining 99 concepts target their imported source identity. In particular, generic chicken breast targets raw BLS `V416100`; the existing `catalog-chicken-breast-roasted` keeps preparation-specific meaning.

Every publisher selection is by exact source ID and the adapter also requires the reviewed tokens in the normalized publisher name. A missing ID, changed publisher name, or missing explicit starter target fails closed. Nutrition stays on its source-bound Food; the alias overlay never changes nutrition, deletes rows, or merges sources.

## Real projected search audit

The audit builds an in-memory catalog from all 978 production Foods and all 53 production FoodAlias rows, applies the exact proposed Food fields and alias upserts, and invokes the unchanged application `searchFoods()` implementation for every corpus query. `interpretMealInput()` is separately exercised for the serving-sensitive and collision-prone inputs.

| Classification | Current production | Projected apply result |
|---|---:|---:|
| PASS_EXACT | 18 | 239 |
| PASS_ALIAS | 0 | 1 |
| PASS_PARTIAL | 40 | 0 |
| PASS_FUZZY | 0 | 0 |
| AMBIGUOUS | 26 | 4 |
| ↳ true interpreter ambiguity | — | 3 |
| ↳ generic low-confidence rank tie | — | 1 |
| WRONG_TOP_RESULT | 25 | 0 |
| MISSING | 135 | 0 |
| Pass rate | 23.8% | 98.4% |

The projected 98.4% is now based on 244 real `searchFoods()` runs: 240 correct top results and four observed generic score ties. `sajt` and `Käse` tie Cheddar and Gouda at 95/95 and would be marked ambiguous by `interpretMealInput()`. `fish` ties two results at 80/80 and also crosses that ambiguity threshold. `bread` returns two equal partial results at 70/70; it is a real search-rank tie, but `interpretMealInput()` correctly keeps it low-confidence rather than setting its `ambiguous` flag. No ranking threshold was changed to obtain these results.

The original alias-membership audit also printed 98.4%, but did not establish ranking correctness. The numerical percentage is unchanged; its evidentiary basis is now the real projected search implementation.

## Original European Essentials compatibility

All 100 original must-find queries are also executed through the unchanged `searchFoods()` and `interpretMealInput()` paths against the same real production projection. Current production classifies 75 as correct, 19 as ambiguous, 6 as wrong-top and 0 as missing. The projected apply improves this to 91 correct, 8 ambiguous, 1 wrong-top and 0 missing, with zero per-query regressions.

The remaining wrong-top result is the pre-existing `pork-chop` query: both before and after projection, `Schweinekotelett` ranks BLS `Y321222` first at 80 and the expected BLS `U622100` second at 70. That concept is outside the 81 reused Essentials identities, so this targeted compatibility pass does not change search ranking to mask it. A permanent deterministic regression test runs all 100 original searches, requires zero wrong and zero missing results in the controlled source fixture, and documents the intentional chicken-breast and Gouda confirmation cases.

## Collision evidence

The previous proposed import would have produced exact 100/100 cross-source ties and `confirmation_required` results for common inputs including `tojás`/`tojas`, `avokádó`/`avocado`, `vaj`/`Butter`, `Spinat`, `uborka`/`Gurke`, `Gouda` and `Cheddar`. The explicit alias targets remove those accidental ties. After projection these everyday terms have one clear accepted top result, while preparation-specific fried and scrambled egg Foods remain selectable.

`2 eggs`, `2 tojás` and `2 Eier` all resolve to `catalog-egg`, remain unambiguous, and use its authoritative 50 g serving (100 g total). Butter, avocado, spinach, cucumber, Gouda and Cheddar resolve to their serving-preserving starter records. Plain `chicken breast` resolves to raw BLS `V416100`; `fried egg`/`tükörtojás` and `scrambled egg`/`rántotta` still select their preparation-specific Foods.

## Alias safety

Alias planning uses the production uniqueness key `(foodId, normalizedAlias, locale)`. It reports 381 creates, 29 updates and the seven explicit target Food IDs. Upserts are scoped and restart-safe; stale and unrelated aliases are retained. A localized name wins over a synonym with the same food/locale/normalized value. User-created Foods are excluded by the source import identity and explicit-target preflight.

The bounded `contains + take 60` alias lookup was exercised for `Ei`, `oil`, `ham`, `rice` and every 2–3-character alias present in the projected catalog. The measured examples do not exceed 60 matching alias rows (`Ei`: 26, `oil`: 3, `ham`: 3, `rice`: 1); exact aliases remained inside the bound where one exists. No evidence justified a search-order change or new index.

## Read-only production dry-run

The guarded command was run against an exact read-only production snapshot and the official publisher files:

- 106 input / 106 valid / 0 skipped / 0 duplicates.
- 19 Foods to create and 87 exact source identities to update.
- 381 FoodAlias creates and 29 FoodAlias updates.
- 3,191 expected FoodNutrient upserts and 0 new nutrient definitions.
- 488,661 bytes (about 477 KiB) conservative estimated growth, including the explicit alias overlay.
- 240/240 source-bound terms represented; separately, 244/244 real projected searches are either correct-top or intentionally tied.

Before and after the dry-run, production remained exactly 978 Food rows, 53 FoodAlias rows, 24,843 FoodNutrient rows and 6,307,840 catalog bytes. The snapshot path and Render verification are read-only, and the dry-run reports `writesAttempted: 0`.

An eventual separately approved apply would perform only the reported 19 Food creates, 87 source-identity Food updates, 410 idempotent alias upserts and 3,191 nutrient-link upserts. It would delete nothing and would not modify user-owned Foods. Exact final FoodAlias count is projected as 434; nutrient-link row growth is not claimed because existing links are updated in place.

## Guarded command

Dry-run is the default. Write mode requires both `--apply` and `--confirm everyday-coverage-v2`; snapshot mode cannot be combined with apply. The command is not referenced by seed, start or Render postdeploy scripts. Production apply has not occurred and needs separate approval.

```bash
npm run catalog:coverage -w apps/api -- \
  --bls /data/BLS_4_0_Daten_2025_DE.xlsx \
  --usda-sr /data/FoodData_Central_sr_legacy_food_csv_2018-04 \
  --usda-foundation /data/FoodData_Central_foundation_food_csv_2026-04-30 \
  --batch-size 75
```
