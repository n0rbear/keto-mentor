import type { PrismaClient } from "@prisma/client";
import { aiEstimateMealItemSchema } from "@keto-mentor/shared";
import { verifyAiEstimateProof } from "../catalog/ai-estimate-proof.js";
import { findUserPrivateFood } from "../catalog/dynamic-food-resolution.js";
import { buildSearchText, normalizeSearch } from "../catalog/normalize.js";

/** Accept a signed ingredient estimate as a private food, without logging a meal. */
export async function acceptIngredientEstimate(prisma: PrismaClient, userId: string, body: unknown) {
  const item = aiEstimateMealItemSchema.parse(body);
  const verified = verifyAiEstimateProof(item.aiEstimateProof, userId, item);
  const existing = await findUserPrivateFood(prisma, userId, normalizeSearch(item.requestedIdentity));
  if (existing && [existing.name, existing.originalName].some((name) => typeof name === "string"
    && normalizeSearch(name) === normalizeSearch(item.requestedIdentity))) return existing;
  return prisma.food.create({ data: {
    name: item.canonicalFoodName, originalName: item.requestedIdentity, source: "ai_estimated", createdById: userId,
    kcalPer100g: item.kcalPer100g, proteinPer100g: item.proteinPer100g, fatPer100g: item.fatPer100g,
    carbsPer100g: item.carbsPer100g, fiberPer100g: item.fiberPer100g,
    searchText: buildSearchText({ name: item.canonicalFoodName, originalName: item.requestedIdentity }),
    provenance: { method: "ai_ingredient_estimate", requestedIdentity: item.requestedIdentity,
      canonicalFoodName: item.canonicalFoodName, userAccepted: true, acceptedAt: new Date().toISOString(),
      confidence: verified.confidence ?? null, assumptions: verified.assumptions ?? null }
  } });
}
