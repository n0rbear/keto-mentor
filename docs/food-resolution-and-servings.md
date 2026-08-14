# Food resolution, servings and source discovery

## Deterministic resolution

`GET /foods` normalizes accents and German sharp-s, expands a reviewed multilingual everyday-food lexicon, searches curated `FoodAlias` rows and existing catalog text, then ranks exact, alias, partial and PostgreSQL trigram matches. The response includes the match stage and the parsed natural-language prefix. No cross-source Food records are merged.

Prepared-food expansions are search hints, not nutrient substitutions. For example, `tojásrántotta` searches for `Rührei` and `scrambled egg`; it does not silently use fried-egg nutrition. An absent matching Food remains unresolved.

The natural query parser recognizes deterministic quantities such as `2 db tojás`, `250 g csirkemell` and `15 cm uborka`. A dimension is parsed but remains without gram weight until a Food-specific serving or an explicitly estimated, confirmable conversion is available.

## Food-specific servings

`FoodServing` stores a Food-bound unit, grams per unit, localized labels, provenance, confidence and an `isEstimated` flag. Grams and kilograms are exact mass conversions. Piece, slice, serving, tablespoon, teaspoon, cup, handful, half, quarter and size-specific units are supported by the model only when a concrete Food has a sourced or curated conversion.

Meal creation requires a serving ID for non-mass units. Estimated conversions are visibly marked and may be overridden by the user; exact sourced conversions may not. `MealItem` keeps the original quantity/unit and a conversion snapshot, while the existing immutable `quantityGrams` continues to protect historical totals.

The migration is additive, explicitly schema-qualified to `ketomentor`, and backfills only already-known legacy conversions. It does not manufacture servings for catalog foods that lack them.

## Web nutrition source discovery boundary

`NutritionSourceSearchProvider` is a provider-neutral discovery contract. Search results contain candidate URLs and metadata only. Search snippets are never accepted as nutrition data. The shipped provider is disabled; there is no automatic web import or search-engine scraping in production.

When a provider is added, candidates are ordered BLS/MRI, USDA, other official government/scientific databases, manufacturers, then other structured databases. A separate, reviewed fetch/extract path must open the source, require HTTPS, validate a per-100 g basis, retain source URL/domain/title/identifier/version and retrieval time, and map only numerical values present in the source. Conflicting authoritative values are not averaged: the higher-priority source wins only when identity is clear, otherwise the record remains ambiguous for review.

DuckDuckGo is intentionally not hard-coded: its public help documents search syntax but does not provide the stable, documented general search API contract required for unattended nutrition ingestion. USDA FoodData Central does provide an official REST search/details API, requiring a data.gov API key, and is the preferred programmatic fallback after local catalog resolution. An admin-supplied URL can later implement the same provider contract without changing the resolver.

An LLM may later help formulate queries, rank candidates, map nutrient labels, or estimate a quantity-to-weight conversion. Weight estimates must be labelled, confidence-scored, traceable and user-correctable. An LLM may never generate nutrition numbers or resolve conflicting nutrition sources without evidence.
