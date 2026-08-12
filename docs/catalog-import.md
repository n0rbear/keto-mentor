# Catalog pilot import runbook

Verified 2026-08-11 against primary publisher material. Raw archives stay outside Git and imports never run during deploy or the normal seed.

## Current importer audit

Before this branch, the importer accepted only a custom, already-normalized CSV fixture. It upserted one food at a time by `(source, sourceId)` and upserted nutrient definitions/links, but both USDA and BLS were labelled `open_database`. It had no native source parser, validation report, dry-run, batch progress, pilot sampling, size measurement, or restart report. Search already uses normalized original/localized names and a PostgreSQL `pg_trgm` GIN index. The normal six-food multilingual seed remains unchanged and fast.

## Official sources and licensing

| Source | Selected release | Format and publisher size | Records | License / commercial use | Attribution | Updates |
|---|---|---|---:|---|---|---|
| USDA FoodData Central Foundation Foods | 2026-04-30 | CSV ZIP 3.7 MB, 32 MB extracted; JSON also available | 395 Foundation food identities; 322 pass Keto Mentor's required-macro validation | CC0 1.0/public domain; commercial use allowed | Permission is not required; USDA requests FoodData Central citation | April and October |
| USDA FoodData Central SR Legacy | final 2018-04 | CSV ZIP 6.7 MB, 54 MB extracted; JSON also available | 7,793 | CC0 1.0/public domain; commercial use allowed | same requested citation | final/frozen release |
| Bundeslebensmittelschlüssel | BLS 4.0 (2025) | ZIP 14.3 MB containing `BLS_4_0_Daten_2025_DE.xlsx`, component workbook and PDF | 7,140 rows; 7,090 pass required-macro validation; 138 components per publisher documentation | CC BY 4.0 Open Data; commercial use allowed | required: `Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.` plus license | publisher-managed; 4.0 released December 2025 |

Primary references: [USDA downloads](https://fdc.nal.usda.gov/download-datasets/), [USDA data-type/update documentation](https://fdc.nal.usda.gov/data-documentation/), [USDA API licensing](https://fdc.nal.usda.gov/api-guide/), [BLS download and CC BY statement](https://blsdb.de/download), [BLS 4.0 documentation](https://blsdb.de/bls).

Foundation Foods is preferred for its analytical detail and provenance, but it is intentionally small and some records omit one or more required macros. SR Legacy supplies broad, stable basic-food coverage. Branded Foods (2.9 GB extracted in the April 2026 CSV release) is explicitly excluded.

## Scope and estimates

The full selected catalog is Foundation + SR Legacy + BLS: 15,328 source rows, 15,205 currently valid food records, and about 442,609 mapped `FoodNutrient` links. Based on the importer's conservative row/link estimator, this is roughly 56 MB; allow **55–90 MB** PostgreSQL growth including JSON, tuple overhead, the unique identity index, relation indexes, and the trigram GIN index. This is an estimate, not a production measurement. Expected runtime is tens of minutes on a small hosted database, versus seconds/minutes for the pilot; network/IOPS dominate.

The proposed pilot has 1,000 source rows: all 395 Foundation identities, a category-balanced 105 SR Legacy rows, and a category-balanced 500 BLS rows. Current parsing yields **904 valid foods**, 96 skipped rows, and **22,894** nutrient links. Estimated PostgreSQL growth is **about 3 MB**, with a planning range of **3–6 MB** including indexes. It deliberately spans meat, poultry, eggs/dairy, vegetables, fruit, fats/oils, nuts/seeds, fish, and carbohydrate-rich controls.

The 2026-08-11 write-free dry-run against an empty-catalog model reported: Foundation 395 input / 322 valid / 73 skipped / 322 create / 0 update / 5,961 links / 892,955 estimated bytes; SR Legacy 105 / 105 / 0 / 105 / 0 / 2,897 / 386,775 bytes; BLS 500 / 477 / 23 / 477 / 0 / 14,036 / 1,812,657 bytes. Combined: 1,000 input, 904 valid, 96 skipped, 0 duplicates, 904 creates, 0 updates, 31 shared nutrient definitions, 22,894 links, and 3,092,387 estimated bytes. The production-aware create/update counts must be re-measured against production immediately before any approved write.

## Identity, language, and nutrients

Identity is strictly `(source, sourceId)` with distinct `usda_fdc` and `bls` source values. No cross-source or same-name merge occurs. This leaves room for later canonical-food, alias, or duplicate-group tables without making unsafe matches now.

USDA stores `originalName` and `names.en`; BLS stores the German `originalName` and `names.de`. `searchText` includes the original name. Existing manually seeded HU/DE/EN names are untouched. No AI translation is generated.

`nutrient-mapping.ts` maps USDA nutrient IDs and BLS component codes onto shared keys for energy/macros, sugar/fat classes, sodium, potassium, calcium, magnesium, phosphorus, iron, zinc, copper, manganese, selenium, and vitamins A, B1/B2/B3/B5/B6/B7/B9/B12/C/D/E/K. Units are normalized (`g`, `mg`, `ug`, `kcal`); BLS copper/manganese and B6 micrograms are converted. Unknown identifiers are skipped rather than creating source-specific duplicate definitions.

## Safe execution (only after merge and explicit production approval)

1. Download archives from the official links into ephemeral job storage and verify the release/file names above. Extract USDA ZIPs; point BLS at the XLSX.
2. Capture before sizes: `npm run catalog:db-size -w apps/api`.
3. Run each command with `--dry-run`; review every parse error and the create/update/link totals:

   ```bash
   npm run catalog:import -w apps/api -- usda-foundation /data/foundation --dry-run --pilot 395 --batch-size 100
   npm run catalog:import -w apps/api -- usda-sr-legacy /data/sr --dry-run --pilot 105 --batch-size 100
   npm run catalog:import -w apps/api -- bls /data/BLS_4_0_Daten_2025_DE.xlsx --dry-run --pilot 500 --batch-size 100
   ```

4. Remove `--dry-run` only after approval. The importer commits per food, reports every batch, uses upserts, and can resume after partial failure. Stop on unexpected error; rerun is safe.
5. Capture after sizes and subtract before values. Run `API_URL=... ACCESS_TOKEN=... npm run catalog:benchmark -w apps/api`, then verify search, select, grams/serving, meal save, totals, and reload persistence.

No production database URL is available in this development environment, so production sizes, authenticated `/foods` timings, and meal-flow regression are intentionally deferred until the branch is merged and a separate production-import instruction is given.

## European essentials supplement

The category-balanced pilot is complemented by a separately reviewed, source-ID-bound 100-food European essentials manifest. See [European essentials pilot](./european-essentials.md). Its default command is dry-run, its only USDA fallback is an explicit SR Legacy Tempeh identity, and it never fuzzy-selects source records.

Recipe composition is intentionally not part of the catalog import. The next-phase data and calculation boundaries are recorded in [Recipe architecture](./recipe-architecture.md).
