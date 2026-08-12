# European essentials pilot

This supplement is an explicit 100-food must-have catalog, not a category sample. Every item is bound to an audited publisher identity in `european-essentials-manifest.ts`. Runtime selection never uses names, fuzzy matching, similarity scores, or category position.

## Approved composition

- 97 BLS 4.0 records, selected by exact BLS code.
- 3 USDA SR Legacy fallbacks: FDC `174272` Tempeh, `171412` coconut oil and `171401` lard. The two oils replace BLS identities that omit a required base macro; no zero value is invented.
- 100 deterministic must-find cases. They include German originals, aliases, accentless spelling and partial queries.
- Mandatory identities: Brokkoli `G312100`, Gurke `G520100`, Knoblauch `G490100`, Kabeljau `T204100`, Thunfisch `T121100`, Birne `F130100`.

The BLS record is accepted only when its exact source ID exists, its required macros pass the normal importer validation, and its normalized original name contains all reviewed identity tokens. A missing or changed record is reported as unresolved and skipped. No fallback is selected automatically. Aliases such as `Brokkoli` for BLS `Broccoli roh` affect search only; they do not change provenance or nutrition.

## Safe execution

Raw publisher files remain outside Git. The command defaults to dry-run and accepts only batch sizes from 50 through 100:

```bash
npm run catalog:essentials -w apps/api -- \
  --bls /data/BLS_4_0_Daten_2025_DE.xlsx \
  --usda-sr /data/FoodData_Central_sr_legacy_food_csv_2018-04 \
  --batch-size 75
```

The output includes the BLS/USDA split, source reports, create/update/link estimates, parsing errors, estimated growth, and the 100-query must-find audit. Dry-run is the default and performs no writes through `importFoods`.

Write mode is deliberately guarded by two explicit flags and must only be used after the dry-run and a separate production approval:

```bash
npm run catalog:essentials -w apps/api -- \
  --bls /data/BLS_4_0_Daten_2025_DE.xlsx \
  --usda-sr /data/FoodData_Central_sr_legacy_food_csv_2018-04 \
  --batch-size 75 --apply --confirm european-essentials
```

The normal seed and Render deploy do not invoke this command. Identity remains `(source, sourceId)` and no USDA/BLS cross-source merge occurs.

## Controlled production result (2026-08-12)

The approved dry-run against the shared production database and `ketomentor` schema resolved 100/100 records: BLS 97 valid / 0 skipped and USDA SR Legacy 3 valid / 0 skipped. It reported 64 creates, 36 updates, 0 duplicates, 0 new nutrient definitions, 3,028 nutrient-link upserts and 387,634 estimated growth bytes. Before/after counts and sizes were identical, proving zero dry-run writes.

The approved write created 64 foods and updated 36 existing source identities. A second identical run reported 0 creates and 100 updates. Food count changed 910 to 974 and FoodNutrient 22,894 to 24,843; Nutrient remained 32. The database grew 565,248 bytes (about 0.54 MiB), while `public` schema size and object counts remained unchanged.

The production UI must-find pass rate was 100/100 after four transient empty autocomplete responses succeeded on a slower retry. Brokkoli, Gurke, Knoblauch, Kabeljau, Thunfisch and Birne all returned their bound records. Accentless and partial checks included `hahnchen`, `kase`, `weisskohl`, `susskirsche` and `zucch`.
