import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { confirmAuthoritativeFood, externalFoodConfirmationSchema, type ConfirmableFoodLookupAdapter, type LocalizationOptions } from "../catalog/external-food.js";
import { previewRecipeImport } from "./recipe-import.js";
import { verifyRecipeImportProof, type ImportProofMethod } from "./import-proof.js";
import { classifyRecipeReview, computeTrustedNutrition, toIngredientReview, type ReviewableIngredient } from "./recipe-ingredient-review.js";
import type { RecipeExtractionProvider } from "./recipe-extraction-provider.js";
import type { DynamicResolutionDeps } from "../meal-input/interpret.js";
import type { SafeFetcherDependencies } from "./safe-url-fetcher.js";
import { learnConfirmedAlias } from "../catalog/confirmed-alias.js";
import type { FoodLocale } from "../catalog/food-locale.js";

/**
 * Batch recipe-ingredient confirmation (owner-beta blocker #7, 2026-09-11).
 *
 * Review-proof strategy: the existing importProof (import-proof.ts) is reused
 * completely unchanged. It was never extended to carry ingredient/candidate
 * data because that data is never trusted from the client in the first
 * place — this handler RE-DERIVES the current recipe preview (a fresh
 * previewRecipeImport call against the proof's own sourceUrl) both before
 * validating confirmations and after applying them. The proof's only job
 * stays exactly what it already was: prove this authenticated user was
 * genuinely shown a preview of this exact URL, extracted by this exact
 * method, within its TTL — never a claim about specific ingredients or
 * candidates, which would be meaningless to trust from the client anyway
 * (a page can change between preview and confirm; only a live re-fetch is
 * trustworthy). This is why no proof extension was needed.
 */
export const MAX_BATCH_CONFIRMATIONS = 20;

// Extends each member of the EXISTING externalFoodConfirmationSchema union
// (never restates its source/sourceId regex) with the one extra field this
// endpoint needs. z.intersection of two .strict() object schemas does not
// work in zod (each side independently rejects the other's keys as
// "unrecognized") — .extend() on the real per-source schemas is the correct
// way to reuse them without duplicating the validation pattern.
const confirmationEntrySchema = z.discriminatedUnion("source", [
  externalFoodConfirmationSchema.options[0].extend({ ingredientIndex: z.number().int().min(0).max(49) }),
  externalFoodConfirmationSchema.options[1].extend({ ingredientIndex: z.number().int().min(0).max(49) })
]);

export const recipeIngredientConfirmationRequestSchema = z.object({
  importProof: z.string().min(1).max(2_000),
  sourceUrl: z.string().url().max(2_000),
  extractionMethod: z.enum(["schema_org_json_ld", "ai_structured"]),
  confirmations: z.array(confirmationEntrySchema).min(1).max(MAX_BATCH_CONFIRMATIONS)
}).strict();

export type RecipeIngredientConfirmationRequest = z.infer<typeof recipeIngredientConfirmationRequestSchema>;

export type ConfirmationOutcomeEntry = {
  ingredientIndex: number;
  source: string;
  sourceId: string;
  result: "confirmed" | "existing" | "confirmation_required" | "unresolved" | "error";
};

export type RecipeIngredientConfirmationResult = {
  before: { resolvedCount: number; confirmationRequiredCount: number; unresolvedCount: number; state: "fully_resolved" | "reviewable" | "unusable" };
  confirmations: ConfirmationOutcomeEntry[];
  after: {
    recipeState: "fully_resolved" | "reviewable" | "unusable";
    resolvedCount: number;
    confirmationRequiredCount: number;
    unresolvedCount: number;
    nutritionCalculable: boolean;
    nutritionPer100g: ReturnType<typeof computeTrustedNutrition>["macros"];
    ingredients: ReturnType<typeof toIngredientReview>[];
  };
  /** A fresh proof for the RECOMPUTED preview, minted the same way /import-url/preview already does — the old proof is single-purpose (this request) and not reused for a follow-up confirmation round. */
  importProof: string;
};

export type RecipeIngredientConfirmationDeps = {
  recipeAiProvider: RecipeExtractionProvider;
  dynamic: DynamicResolutionDeps;
  confirmAdapters: readonly ConfirmableFoodLookupAdapter[];
  localization?: LocalizationOptions;
  fetchDependencies?: SafeFetcherDependencies;
  mintProof: (sourceUrl: string, method: ImportProofMethod) => string;
  // Owner-beta blocker #8 (2026-09-11): the confirming user's REGIONAL
  // food-vocabulary locale (e.g. "de-AT") — required to correctly locale-
  // scope the confirmed alias this handler now learns after each successful
  // confirmation (see catalog/confirmed-alias.ts). Distinct from `dynamic`/
  // `localization`'s own locale fields, though callers normally derive all
  // three from the same source (the authenticated user's trusted locale).
  foodLocale: FoodLocale;
};

function invalidRequest(publicCode: string) {
  return Object.assign(new Error(publicCode), { status: 400, publicCode });
}

/**
 * Re-derives the CURRENT real recipe preview server-side — never trusts a
 * client-submitted ingredient/candidate list. This is what makes candidate
 * injection structurally impossible: "ingredient potato -> USDA id for
 * chocolate cake" can never pass the membership check below because the
 * chocolate-cake sourceId was never present in THIS freshly-computed
 * externalCandidates array, regardless of what the client claims.
 */
async function reDerivePreview(prisma: PrismaClient, sourceUrl: string, deps: RecipeIngredientConfirmationDeps) {
  const extracted = await previewRecipeImport(prisma, sourceUrl, deps.fetchDependencies ?? {}, deps.recipeAiProvider, deps.dynamic);
  const reviews = extracted.ingredients.map((ingredient) => toIngredientReview(ingredient as unknown as ReviewableIngredient));
  return { extracted, reviews };
}

export async function confirmRecipeIngredients(
  prisma: PrismaClient,
  userId: string,
  request: RecipeIngredientConfirmationRequest,
  deps: RecipeIngredientConfirmationDeps
): Promise<RecipeIngredientConfirmationResult> {
  // Proof verification — completely unchanged mechanism/semantics.
  verifyRecipeImportProof(request.importProof, userId, request.sourceUrl, request.extractionMethod);

  const { reviews: beforeReviews } = await reDerivePreview(prisma, request.sourceUrl, deps);
  const beforeSummary = classifyRecipeReview(beforeReviews);

  // Structural validation of the WHOLE batch happens before any external
  // call — a single tampered/malformed entry fails the whole request
  // (fail closed), exactly as it would for an out-of-range array index or
  // a candidate that was never legitimately offered.
  const seenIndexes = new Set<number>();
  for (const entry of request.confirmations) {
    if (seenIndexes.has(entry.ingredientIndex)) throw invalidRequest("duplicate_ingredient_index");
    seenIndexes.add(entry.ingredientIndex);
    const review = beforeReviews[entry.ingredientIndex];
    if (!review) throw invalidRequest("ingredient_index_out_of_range");
    if (review.status !== "confirmation_required") throw invalidRequest("ingredient_not_confirmable");
    const offered = review.externalCandidates?.some((candidate) => candidate.source === entry.source && candidate.sourceId === entry.sourceId);
    if (!offered) throw invalidRequest("candidate_not_offered_for_ingredient");
  }

  // Each confirmation is independent — see the checkpoint's own atomicity
  // guidance: confirmAuthoritativeFood fuses an external network re-fetch
  // with its own short, isolated DB persistence ($transaction scoped only
  // to the write, inside persistCandidate) and cannot be safely split into
  // "validate all, then persist all" without either holding a transaction
  // open across N network calls (unsafe) or duplicating its internals
  // (forbidden). So this is PER-CONFIRMATION atomicity, not cross-batch
  // atomicity: one failure never rolls back another item's already-real
  // persisted Food row, and every other requested confirmation is still
  // attempted. The per-item `result` in the response is the source of
  // truth for what actually happened — never inferred, never assumed.
  const confirmations: ConfirmationOutcomeEntry[] = [];
  for (const entry of request.confirmations) {
    try {
      const outcome = await confirmAuthoritativeFood(prisma, entry.source, entry.sourceId, deps.confirmAdapters, deps.localization);
      confirmations.push({ ingredientIndex: entry.ingredientIndex, source: entry.source, sourceId: entry.sourceId, result: outcome.status === "confirmed" || outcome.status === "existing" ? outcome.status : outcome.status === "confirmation_required" ? "confirmation_required" : "unresolved" });
      // Learn the confirmed locale-specific identity ONLY on a real,
      // server-verified success — never on confirmation_required/unresolved/
      // error. Uses the ORIGINAL ingredient's parsedFoodQuery (identity only,
      // no quantity/unit noise — see recipe-ingredient-review.ts) from the
      // BEFORE snapshot, since that is what the user actually confirmed a
      // match for.
      if (outcome.status === "confirmed" || outcome.status === "existing") {
        const originalReview = beforeReviews[entry.ingredientIndex];
        await learnConfirmedAlias(prisma, {
          foodId: outcome.food.id,
          parsedFoodQuery: originalReview.parsedFoodQuery,
          foodLocale: deps.foodLocale,
          provenance: { sourceUrl: request.sourceUrl, ingredientIndex: entry.ingredientIndex, source: entry.source, sourceId: entry.sourceId }
        });
      }
    } catch {
      confirmations.push({ ingredientIndex: entry.ingredientIndex, source: entry.source, sourceId: entry.sourceId, result: "error" });
    }
  }

  // Recomputation strategy: re-run the REAL resolver against the now-updated
  // database state — never mutate the "before" JSON in place. A just-
  // confirmed Food is only ever visible here because interpretMealInput's
  // own local search now genuinely finds it (or, if cross-language coverage
  // fails — see hasSemanticCoverage — it may legitimately stay
  // confirmation_required/unresolved; this handler never forces a result).
  const { reviews: afterReviews } = await reDerivePreview(prisma, request.sourceUrl, deps);
  const afterSummary = classifyRecipeReview(afterReviews);
  const afterNutrition = computeTrustedNutrition(afterReviews);

  return {
    before: { resolvedCount: beforeSummary.resolvedCount, confirmationRequiredCount: beforeSummary.confirmationRequiredCount, unresolvedCount: beforeSummary.unresolvedCount, state: beforeSummary.state },
    confirmations,
    after: {
      recipeState: afterSummary.state,
      resolvedCount: afterSummary.resolvedCount,
      confirmationRequiredCount: afterSummary.confirmationRequiredCount,
      unresolvedCount: afterSummary.unresolvedCount,
      nutritionCalculable: afterNutrition.calculable,
      nutritionPer100g: afterNutrition.macros,
      ingredients: afterReviews
    },
    importProof: deps.mintProof(request.sourceUrl, request.extractionMethod)
  };
}
