import { Router } from "express";
import rateLimit from "express-rate-limit";
import { recipeImportPreviewSchema, recipeInputSchema, recipeListQuerySchema, recipeMealSchema } from "@keto-mentor/shared";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { addRecipeToMeal, createRecipe, deleteRecipe, forkRecipe, getVisibleRecipe, listOwnRecipes, listPublicRecipes, serializeRecipe, updateRecipe } from "./service.js";
import { previewRecipeImport } from "./recipe-import.js";
import { createRecipeImportProof, verifyRecipeImportProof } from "./import-proof.js";
import { RECIPE_IMPORT_RATE_LIMIT, recipeImportRateLimitKey } from "./recipe-import-rate-limit.js";

export const recipeRouter = Router();
recipeRouter.use(requireAuth);
const importPreviewLimiter = rateLimit({ ...RECIPE_IMPORT_RATE_LIMIT, keyGenerator: recipeImportRateLimitKey });

recipeRouter.post("/import-url/preview", importPreviewLimiter, async (req, res, next) => {
  try {
    const { url } = recipeImportPreviewSchema.parse(req.body);
    const preview = await previewRecipeImport(prisma, url);
    res.json({ preview: { ...preview, importProof: createRecipeImportProof(req.user!.id, preview.sourceUrl) } });
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
    const trustedImport = input.sourceType === "schema_org" && input.sourceUrl && input.importProof
      ? verifyRecipeImportProof(input.importProof, req.user!.id, input.sourceUrl)
      : undefined;
    if (input.sourceType === "schema_org" && !trustedImport) throw Object.assign(new Error("invalid_import_proof"), { status: 400, publicCode: "invalid_import_proof" });
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
