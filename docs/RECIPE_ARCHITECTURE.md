# Recipe Builder architecture

## Current MVP

`Recipe` is an owner-scoped aggregate containing ordered `RecipeIngredient` rows that reference existing `Food` records. Recipe nutrition is calculated from the current Food and FoodNutrient catalog whenever a recipe is read; Food records are not cloned.

Visibility defaults to `private`. Private and prepared `unlisted` recipes are owner-only in the MVP. Public recipes can be listed and read by any authenticated user, but update and soft-delete operations always require ownership. Forking a public recipe creates a detached private copy for the current user while retaining `forkedFromRecipeId`, original author and provenance.

When a recipe is logged, `MealItem` stores recipe identity, display name, selected weight and a complete macro/micronutrient snapshot. Meal totals prefer that snapshot. Later Recipe or Food edits update the live recipe calculation but never rewrite meal history. Recipe deletion is soft deletion; the recipe relation uses `SET NULL`, while display and nutrition snapshots remain readable.

All migration SQL is explicitly qualified with `ketomentor`; it does not touch `public`.

## Future URL import pipeline

1. URL submitted to a backend-only endpoint.
2. Safe fetch with DNS and redirect revalidation.
3. Bounded HTML parsing and sanitization.
4. Prefer JSON-LD `schema.org/Recipe` extraction.
5. Parse ingredient strings into amount, unit, name and preparation.
6. Match Food candidates with confidence and provenance.
7. Require confirmation for unresolved or ambiguous matches.
8. Create a normal Recipe; calculate nutrition only from selected Food records.

Store only source URL, title, ingredients, servings, necessary structured metadata, extraction method and attribution. Do not retain full pages or recipe articles.

## Extraction provider contract

```ts
interface RecipeExtractionProvider {
  extract(input: SanitizedRecipeContent): Promise<{
    title: string;
    servings?: number;
    ingredients: Array<{
      rawText: string;
      amount?: number;
      unit?: string;
      name: string;
      preparation?: string;
    }>;
  }>;
}
```

The primary provider is deterministic schema.org/JSON-LD parsing. A future AI provider may only structure sanitized text. It must never emit kcal, macros, micronutrients or invented Food nutrition; those always come from Keto Mentor's Food catalog.

## URL import security requirements

- Allow only HTTP/HTTPS; reject URL credentials.
- Reject localhost, loopback, private, link-local and reserved IPv4/IPv6 ranges and cloud metadata endpoints.
- Resolve and revalidate destinations to resist DNS rebinding; revalidate every redirect with a strict redirect limit.
- Apply short connect/read/total timeouts, response-size and decompression limits.
- Validate HTML content type; do not forward cookies, auth headers or internal credentials.
- Sanitize HTML and never execute scripts or load subresources.
- Log safe metadata only.

No general URL fetcher or production AI integration is included in this MVP.
