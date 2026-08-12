# Recipe architecture (next phase)

This is a design boundary for a later migration and feature PR. The essentials pilot does not create recipe tables or change meal behavior.

## Domain model

- `Recipe`: owner, localized title, instructions, source URL/provenance, total prepared weight, default serving count and timestamps.
- `RecipeIngredient`: recipe, required `Food` reference, amount in grams, optional preparation note and stable order.
- `RecipeServing`: optional named serving with grams or a fraction of the finished recipe.
- `MealItem`: later gains an optional recipe snapshot reference while retaining the existing direct-Food path.

Ingredients always point to catalog `Food` records. Nutrition is calculated from the referenced food values and ingredient grams; it is never copied from generative output.

For nutrient `n` and ingredient `i`:

`recipe_total[n] = sum(food_i[n] * ingredient_grams_i / 100)`

`recipe_per_100g[n] = recipe_total[n] * 100 / finished_recipe_grams`

`serving[n] = recipe_total[n] / serving_count`, or by an explicitly stored serving weight. Rounding is for display only; calculations retain database precision.

## Persistence and meal safety

Adding a saved recipe to a meal should create an immutable nutrition snapshot for the selected serving. Later edits to the recipe must not rewrite historical daily totals. Foreign keys and ownership checks prevent cross-user access; deleting a recipe must not delete existing meals.

## URL import pipeline

1. Fetch an explicitly supplied URL with SSRF protections, size/time limits and an allowlisted content type.
2. Parse `schema.org/Recipe` JSON-LD first and preserve URL/title/ingredient/instruction provenance.
3. Normalize ingredient text into proposed quantities and units.
4. Resolve every ingredient to an existing `Food` with visible confidence and user confirmation for ambiguity.
5. Only when structured recipe data is missing may AI propose structure (title, ingredient parsing, steps). Low-confidence matches remain unresolved.

AI must never invent calories, macros, micronutrients or serving nutrition. All nutrition comes exclusively from selected `Food` records and deterministic arithmetic. Imported publisher nutrition, website nutrition panels and AI estimates are not authoritative inputs to recipe totals.
