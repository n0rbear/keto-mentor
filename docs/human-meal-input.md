# Human meal input: General Food Understanding v1

## Resolution pipeline

Keto Mentor understands ordinary Hungarian, German and English meal descriptions with a deterministic-first pipeline:

`human text → deterministic quantity parser → deterministic local Food resolver → Mistral food-NLP fallback when needed → trusted Food records → visible confirmation when uncertain`

Simple, safely confirmable inputs such as `2 tojás`, `200 g csirkemell` and `3 szelet Gouda` return immediately and do not consume AI quota. Mistral is considered only when the deterministic result is unresolved or structurally too weak for a compound dish, multiple components, modifiers, exclusions or unusual phrasing. If Mistral is disabled or fails, the existing deterministic result is returned.

## Semantic AI boundary

Mistral may classify the language and meal structure and extract canonical food concepts, explicit quantities, units, preparation, modifiers and exclusions. Its response uses a bounded, strict Zod schema. Unknown fields are rejected, including calories, macros, micronutrients, nutrient IDs and Food IDs.

Every explicit AI-extracted item is resolved again through the existing local Food resolver. AI never creates or updates catalog records, and AI confidence is not nutrition-source confidence. Nutrition comes only from trusted `Food` and `FoodNutrient` records.

The contract distinguishes `explicit` from `inferred_common`. An inferred/common ingredient is shown as an unconfirmed hint, is not sent to Food resolution and has `nutritionEligible: false`; it cannot silently enter a nutrition calculation. If a compound dish such as lecsó has no trusted prepared-dish Food, its base nutrition remains visibly unresolved even when explicit sausage and egg additions resolve independently.

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
- `egy tányér lecsó két virslivel és három tojással`: AI may identify the compound dish and its explicit additions. Sausage and egg resolve independently; the base lecsó remains unresolved if no trusted prepared-dish Food exists.
- `egy döner extra hússal, szósz nélkül`: AI may preserve the `extra meat` modifier and `sauce` exclusion but may not invent grams or nutrition.

## Quantity-estimation boundary

`QuantityEstimationProvider` accepts only parsed quantity context and a resolved Food identity. Its structured output is limited to gram weight, range, confidence, method and provenance. Validation requires provider, model-or-rule identifier and timestamp. Nutrient fields are intentionally absent from the contract.

General Food Understanding does not estimate weights for plates, bowls or ladles. That remains Phase 2 work. A future quantity estimator must run only after Food resolution and remain independently confirmable.

## Configuration, privacy and cost controls

Food NLP is disabled unless both `MISTRAL_API_KEY` and `MISTRAL_MODEL` are configured. `MISTRAL_BASE_URL` is optional. The adapter uses the current Mistral chat-completions JSON mode through native `fetch`, with an eight-second timeout, a 64 KiB response limit and no automatic retry. The authenticated limiter allows 25 actual AI calls per user per 15 minutes; deterministic requests do not consume that quota.

Only the raw meal phrase needed for semantic understanding is sent. Username, user ID, email, profile, health data and database context are not included. Raw meal text, API keys and authorization headers are not logged or returned to the frontend.

## Evaluation strategy

The automatic suite uses mock providers and deterministic semantic fixtures, never the live Mistral API. Its 210 cases cover 80 Hungarian, 65 German and 65 English inputs, including deterministic-safe phrases, compound dishes, colloquial language, unknown foods and prompt-injection attempts. Metrics include structure, explicit items, quantities, modifiers, exclusions, trusted resolution, clarification and accepted unsafe nutrition output; the last must remain zero.

An optional `npm run eval:food-nlp:live -w apps/api` command runs only when a key and model are intentionally supplied. It reports metrics and never mutates catalog or production data.

## Mock product demonstration

The automated product-demo fixtures exercise the real fallback orchestration and local resolver with a mock semantic provider. No live Mistral request is made.

| Input | Source | Understood structure | Trusted resolution | Clarification |
| --- | --- | --- | --- | --- |
| `2 tojás` | deterministic | egg, 2 pieces | `catalog-egg`, 100 g | no |
| `3 szelet Gouda` | deterministic | Gouda, 3 slices | `catalog-gouda`, ≈85.1 g | estimated slice confirmation |
| `egy tányér lecsó két virslivel és három tojással` | AI-assisted | lecsó; sausage 2 pieces; egg 3 pieces | sausage 100 g and egg 150 g; base dish unresolved | yes, base dish composition/portion |
| `egy döner extra hússal, szósz nélkül` | AI-assisted | döner; extra meat; sauce excluded | dish unresolved | yes |
| `fél grillcsirke` | AI-assisted | roast chicken, one half | prepared food/weight unresolved | yes |
| `ein Döner mit extra Fleisch ohne Soße` | AI-assisted | döner; extra meat; sauce excluded | dish unresolved | yes |
| `a Caesar salad without croutons` | AI-assisted | Caesar salad; croutons excluded | dish unresolved | yes |
| `two ladles of beef stew` | AI-assisted | beef stew, 2 ladles | dish/ladle conversion unresolved | yes |

## Missing foods and source discovery

Prepared-food aliases are search expansions, not nutrient substitutions. If `Rührei`, omelette, grilled chicken or another prepared food has no matching catalog record, the response stays unresolved.

Source discovery stays provider-neutral and disabled. The reviewed hierarchy is BLS/MRI, USDA FoodData Central, other official scientific/government databases, official manufacturers, then reviewed structured databases. Search engines may discover an authoritative page but are never nutrition sources. Snippets are never imported.

USDA's official API requires a data.gov key, supplies food search/detail endpoints and Food-specific portion weights, and is the preferred future programmatic serving source. BLS 4.0 is CC BY 4.0 Open Data and supplies per-100 g composition, but does not provide a general human-portion table comparable to USDA `food_portion`; BLS Food servings must therefore come from another traceable source or remain estimates.
