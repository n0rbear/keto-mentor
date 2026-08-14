# Human meal input: confirmation-first MVP

## Scope

The next step is a single-item interpretation endpoint and a fast confirmation UI. It deliberately strengthens quantity infrastructure before attempting free-form multi-item meal sentences. The pipeline is:

`human text -> deterministic quantity parser -> deterministic Food resolver -> Food-specific conversion -> visible confirmation -> existing meal save -> Food/FoodNutrient nutrition`

No LLM or web search is active in production. Nutrition is never accepted from an estimator, search result, snippet or user-language parser.

## Confidence and provenance

The API distinguishes `measured`, `authoritative`, `curated`, `estimated`, `ai_estimated`, and `user_corrected` conversions. Exact grams/kilograms are measured. A sourced `FoodServing` is authoritative; a reviewed internal serving can be curated. Every estimate is visibly marked and requires confirmation. Low-confidence or missing conversions remain unresolved.

`FoodServing` remains the reusable conversion record. `MealItem.quantityGrams` remains the historical nutrition snapshot. `MealItem.conversionSnapshot` keeps the original serving proposal, chosen grams, confidence, provenance, and `userCorrected` flag. This retains useful per-meal correction evidence without creating a global behavioral profile or automatically changing another user's conversions.

## Example behavior

- `125 g uborka`: exact 125 g after Food confirmation.
- `5 tojás`: resolves only when the selected egg Food has a piece serving; five times the sourced piece weight.
- `3 szelet Gouda`: resolves only when that Gouda record has a slice serving. Otherwise it asks for grams; it never borrows another cheese's slice.
- `15 cm kígyóuborka`: parses length and Food identity, but needs a Food-bound estimate provider or reviewed `cm` conversion. With a future provider, a structured gram estimate is labelled `ai_estimated`, displays confidence/provenance and requires confirmation. With the current disabled provider it asks for grams.
- `fél grillcsirke`: the prepared-food resolver may offer candidates, but it never substitutes raw chicken or plain breast nutrition. Food confirmation and a half/whole serving are both required.
- `egy kis darab sajt`: remains low-confidence unless that specific Food has a small-piece conversion; the user gets a short confirmation rather than a silent guess.

## Estimation provider boundary

`QuantityEstimationProvider` accepts only parsed quantity context and a resolved Food identity. Its structured output is limited to gram weight, range, confidence, method and provenance. Validation requires provider, model-or-rule identifier and timestamp. Nutrient fields are intentionally absent from the contract.

A future hosted LLM adapter needs a separately approved API key, strict JSON schema, timeout, per-user rate limit, cache keyed by normalized Food/measure, and no retention of unrelated meal text. It must run only after deterministic resolution and only for missing conversion weights. The current provider is disabled, so this PR has no paid service, API key or production AI traffic.

## Missing foods and source discovery

Prepared-food aliases are search expansions, not nutrient substitutions. If `Rührei`, omelette, grilled chicken or another prepared food has no matching catalog record, the response stays unresolved.

Source discovery stays provider-neutral and disabled. The reviewed hierarchy is BLS/MRI, USDA FoodData Central, other official scientific/government databases, official manufacturers, then reviewed structured databases. Search engines may discover an authoritative page but are never nutrition sources. Snippets are never imported.

USDA's official API requires a data.gov key, supplies food search/detail endpoints and Food-specific portion weights, and is the preferred future programmatic serving source. BLS 4.0 is CC BY 4.0 Open Data and supplies per-100 g composition, but does not provide a general human-portion table comparable to USDA `food_portion`; BLS Food servings must therefore come from another traceable source or remain estimates.
