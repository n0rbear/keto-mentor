# Food resolution, servings and source discovery

## Deterministic resolution

`GET /foods` normalizes accents and German sharp-s, expands a reviewed multilingual everyday-food lexicon, searches curated `FoodAlias` rows and existing catalog text, then ranks exact, alias, partial and PostgreSQL trigram matches. The response includes the match stage and the parsed natural-language prefix. No cross-source Food records are merged.

Prepared-food expansions are search hints, not nutrient substitutions. For example, `tojásrántotta` searches for `Rührei` and `scrambled egg`; it does not silently use fried-egg nutrition. An absent matching Food remains unresolved.

The natural query parser recognizes deterministic quantities such as `2 db tojás`, `250 g csirkemell` and `15 cm uborka`. A dimension is parsed but remains without gram weight until a Food-specific serving or an explicitly estimated, confirmable conversion is available.

## Semantic fallback and trusted re-resolution

The authenticated meal-interpretation endpoint first executes the deterministic parser and resolver. A safely confirmable result is returned without an AI call. When the result is unresolved or cannot represent the input structure, the optional Mistral `food_nlp` capability may produce a strictly validated semantic description of the dish and explicit components.

Mistral does not supply nutrition or catalog identities. Every explicit canonical concept is searched again with the same local `searchFoods` path. Unmatched concepts stay unresolved; no `Food`, alias or nutrient row is written. Common but unstated ingredients use `inferred_common`, are not resolved automatically and are ineligible for nutrition until the user explicitly confirms them.

Compound-dish safety is deliberately conservative. Understanding “lecsó” as a dish does not authorize ingredient or nutrition inference. A trusted prepared-dish Food may be used if one exists; otherwise the dish stays unresolved while explicit additions can resolve independently and in their original order.

## Food-specific servings

`FoodServing` stores a Food-bound unit, grams per unit, localized labels, provenance, confidence and an `isEstimated` flag. Grams and kilograms are exact mass conversions. Piece, slice, serving, tablespoon, teaspoon, cup, handful, half, quarter and size-specific units are supported by the model only when a concrete Food has a sourced or curated conversion.

Meal creation requires a serving ID for non-mass units. Estimated conversions are visibly marked and may be overridden by the user; exact sourced conversions may not. `MealItem` keeps the original quantity/unit and a conversion snapshot, while the existing immutable `quantityGrams` continues to protect historical totals.

The migration is additive, explicitly schema-qualified to `ketomentor`, and backfills only already-known legacy conversions. It does not manufacture servings for catalog foods that lack them.

## Web nutrition source discovery boundary

`NutritionSourceSearchProvider` is a provider-neutral discovery contract. Search results contain candidate URLs and metadata only. Search snippets are never accepted as nutrition data. The shipped provider is disabled; there is no automatic web import or search-engine scraping in production.

When a provider is added, candidates are ordered BLS/MRI, USDA, other official government/scientific databases, manufacturers, then other structured databases. A separate, reviewed fetch/extract path must open the source, require HTTPS, validate a per-100 g basis, retain source URL/domain/title/identifier/version and retrieval time, and map only numerical values present in the source. Conflicting authoritative values are not averaged: the higher-priority source wins only when identity is clear, otherwise the record remains ambiguous for review.

DuckDuckGo is intentionally not hard-coded: its public help documents search syntax but does not provide the stable, documented general search API contract required for unattended nutrition ingestion. USDA FoodData Central does provide an official REST search/details API, requiring a data.gov API key, and is the preferred programmatic fallback after local catalog resolution. An admin-supplied URL can later implement the same provider contract without changing the resolver.

An LLM may help with semantic food understanding, formulate future discovery queries, rank candidates, map nutrient labels, or estimate a quantity-to-weight conversion in a separately reviewed phase. Weight estimates must be labelled, confidence-scored, traceable and user-correctable. An LLM may never generate nutrition numbers or resolve conflicting nutrition sources without evidence.

## Operational controls

Food NLP requires both `MISTRAL_API_KEY` and `MISTRAL_MODEL`; an optional `MISTRAL_BASE_URL` supports an approved compatible endpoint. Missing configuration leaves the provider disabled without affecting deterministic resolution. Calls have an eight-second timeout, a 64 KiB response bound, no automatic retry and a per-user limit of 25 AI calls per 15 minutes. Only actual AI fallback calls consume quota.

The provider receives only the meal phrase. It receives no user identity, profile, email, health context, Food database rows or credentials. Provider failures and malformed or nutrition-bearing responses fail closed to the deterministic result.

Automated evaluation uses a 210-case HU/DE/EN corpus, mock provider responses and strict fixtures, so CI makes no paid or live model calls. The optional live evaluation command requires intentional credentials, prints aggregate metrics and performs no database writes.
