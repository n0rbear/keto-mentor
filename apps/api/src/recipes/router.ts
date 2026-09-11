import { Router } from "express";
import rateLimit from "express-rate-limit";
import { locales, recipeImportPreviewSchema, recipeInputSchema, recipeListQuerySchema, recipeMealSchema, type Locale } from "@keto-mentor/shared";
import { env } from "../config.js";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { addRecipeToMeal, createRecipe, deleteRecipe, forkRecipe, getVisibleRecipe, listOwnRecipes, listPublicRecipes, serializeRecipe, updateRecipe } from "./service.js";
import { previewRecipeImport } from "./recipe-import.js";
import { createRecipeImportProof, verifyRecipeImportProof, type ImportProofMethod } from "./import-proof.js";
import { RECIPE_IMPORT_RATE_LIMIT, recipeImportRateLimitKey } from "./recipe-import-rate-limit.js";
import { configuredRecipeAiProvider } from "./recipe-ai-gateway.js";
import { confirmRecipeIngredients, recipeIngredientConfirmationRequestSchema } from "./recipe-ingredient-confirmation.js";
import { UsdaFoodDataCentralLookupAdapter, OpenFoodFactsProductAdapter } from "../catalog/structured-source-adapters.js";
import { configuredSearchIntentProvider } from "../catalog/search-intent-gateway.js";
import { configuredCandidateLocalizationProvider } from "../catalog/candidate-localization-gateway.js";
import { configuredSemanticCandidateGateProvider } from "../catalog/semantic-candidate-gate-gateway.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import { foodLocaleFor } from "../catalog/food-locale.js";

export const recipeRouter = Router();
recipeRouter.use(requireAuth);
const importPreviewLimiter = rateLimit({ ...RECIPE_IMPORT_RATE_LIMIT, keyGenerator: recipeImportRateLimitKey });
// A separate, tighter quota than preview — each request may trigger up to
// MAX_BATCH_CONFIRMATIONS real external re-fetches, not just one extraction.
const confirmIngredientsLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, keyGenerator: recipeImportRateLimitKey });
// Reuses the exact same configured AI gateway (env, credentials, model) as
// food understanding and quantity estimation — no separate recipe-AI secret.
const recipeAiProvider = configuredRecipeAiProvider(env);
// The only two sourceTypes that ever require a verified import proof; both
// map to the extraction method the proof must have been minted for.
const TRUSTED_SOURCE_METHODS: Partial<Record<string, ImportProofMethod>> = { schema_org: "schema_org_json_ld", ai_structured: "ai_structured" };

// Mirrors server.ts's own USDA/dynamic-resolution wiring exactly (same
// factories, same env vars, same gating on USDA_FDC_API_KEY) — this router
// is a self-contained module that never received server.ts's instances, the
// same reason recipeAiProvider above is independently constructed here
// rather than injected. Nothing here is a second trust system: every one of
// these is the SAME function/class server.ts already uses.
const usdaAdapter = env.USDA_FDC_API_KEY ? new UsdaFoodDataCentralLookupAdapter(env.USDA_FDC_API_KEY) : null;
const openFoodFactsAdapter = new OpenFoodFactsProductAdapter();
const externalFoodAdapters = usdaAdapter ? [usdaAdapter] : [];
const externalFoodConfirmAdapters = usdaAdapter ? [usdaAdapter, openFoodFactsAdapter] : [openFoodFactsAdapter];
const searchIntentProvider = configuredSearchIntentProvider(env);
const candidateLocalizationProvider = configuredCandidateLocalizationProvider(env);
// Owner-beta blocker #9 (2026-09-11): see server.ts's identical wiring and
// catalog/semantic-candidate-gate.ts — re-validates every external candidate
// against the ORIGINAL identity before it can be offered for confirmation,
// auto-resolved, or (via confirmRecipeIngredients's own re-derivation)
// become eligible for a confirmed_external alias.
const semanticCandidateGateProvider = configuredSemanticCandidateGateProvider(env);
const dynamicFoodResolutionLimiter = new DynamicFoodResolutionRateLimiter();
// Identical to server.ts's own trustedLocale — the authenticated user's own
// persisted locale is the single trusted source of UI language, never a
// client-supplied value; falls back to "hu" only if somehow unsupported.
function trustedLocale(user: { locale: string }): Locale {
  return (locales as readonly string[]).includes(user.locale) ? (user.locale as Locale) : "hu";
}

recipeRouter.post("/import-url/preview", importPreviewLimiter, async (req, res, next) => {
  try {
    const { url } = recipeImportPreviewSchema.parse(req.body);
    const preview = await previewRecipeImport(prisma, url, {}, recipeAiProvider);
    res.json({ preview: { ...preview, importProof: createRecipeImportProof(req.user!.id, preview.sourceUrl, preview.extractionMethod) } });
  } catch (error) { next(error); }
});

recipeRouter.post("/import-url/preview/confirm-ingredients", confirmIngredientsLimiter, async (req, res, next) => {
  try {
    const input = recipeIngredientConfirmationRequestSchema.parse(req.body);
    const locale = trustedLocale(req.user!);
    // Owner-beta blocker #8 (2026-09-11): the regional food-vocabulary
    // locale, derived from the user's own trusted `locale` (the only
    // currently-persisted per-user signal — see catalog/food-locale.ts for
    // why this is a safe default rather than a finer-grained region pick).
    const foodLocale = foodLocaleFor(locale);
    const dynamic = externalFoodAdapters.length
      ? { prisma, searchIntentProvider, adapters: externalFoodAdapters, rateLimiter: dynamicFoodResolutionLimiter, userId: req.user!.id, locale, foodLocale, localizationProvider: candidateLocalizationProvider, semanticCandidateGateProvider }
      : null;
    const result = await confirmRecipeIngredients(prisma, req.user!.id, input, {
      recipeAiProvider, dynamic, confirmAdapters: externalFoodConfirmAdapters,
      localization: { locale: foodLocale, provider: candidateLocalizationProvider },
      foodLocale,
      mintProof: (sourceUrl, method) => createRecipeImportProof(req.user!.id, sourceUrl, method)
    });
    res.json(result);
  } catch (error) { next(error); }
});

recipeRouter.get("/", async (req, res, next) => {
  try { res.json(await listOwnRecipes(prisma, req.user!.id, recipeListQuerySchema.parse(req.query))); } catch (error) { next(error); }
});
recipeRouter.get("/public", async (req, res, next) => {
  try { res.json(await listPublicRecipes(prisma, recipeListQuerySchema.parse(req.query))); } catch (error) { next(error); }
});
recipeRouter.post("/", async (req, res, next) => {
  try {
    const input = recipeInputSchema.parse(req.body);
    const expectedMethod = TRUSTED_SOURCE_METHODS[input.sourceType];
    const trustedImport = expectedMethod && input.sourceUrl && input.importProof
      ? verifyRecipeImportProof(input.importProof, req.user!.id, input.sourceUrl, expectedMethod)
      : undefined;
    if (expectedMethod && !trustedImport) throw Object.assign(new Error("invalid_import_proof"), { status: 400, publicCode: "invalid_import_proof" });
    res.status(201).json({ recipe: await createRecipe(prisma, req.user!.id, input, trustedImport) });
  } catch (error) { next(error); }
});
recipeRouter.get("/:id", async (req, res, next) => {
  try { res.json({ recipe: serializeRecipe(await getVisibleRecipe(prisma, req.user!.id, req.params.id)) }); } catch (error) { next(error); }
});
recipeRouter.put("/:id", async (req, res, next) => {
  try { res.json({ recipe: await updateRecipe(prisma, req.user!.id, req.params.id, recipeInputSchema.parse(req.body)) }); } catch (error) { next(error); }
});
recipeRouter.patch("/:id", async (req, res, next) => {
  try { res.json({ recipe: await updateRecipe(prisma, req.user!.id, req.params.id, recipeInputSchema.parse(req.body)) }); } catch (error) { next(error); }
});
recipeRouter.delete("/:id", async (req, res, next) => {
  try { await deleteRecipe(prisma, req.user!.id, req.params.id); res.status(204).end(); } catch (error) { next(error); }
});
recipeRouter.post("/:id/fork", async (req, res, next) => {
  try { res.status(201).json({ recipe: await forkRecipe(prisma, req.user!.id, req.params.id) }); } catch (error) { next(error); }
});
recipeRouter.post("/:id/meals", async (req, res, next) => {
  try { res.status(201).json({ meal: await addRecipeToMeal(prisma, req.user!.id, req.params.id, recipeMealSchema.parse(req.body)) }); } catch (error) { next(error); }
});
