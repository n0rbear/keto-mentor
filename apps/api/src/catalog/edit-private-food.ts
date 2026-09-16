import type { PrismaClient } from "@prisma/client";
import type { EditPrivateFoodInput } from "@keto-mentor/shared";

function foodNotFoundError() {
  return Object.assign(new Error("food_not_found"), { status: 404, publicCode: "food_not_found" });
}
function foodNotEditableError() {
  return Object.assign(new Error("food_not_editable"), { status: 403, publicCode: "food_not_editable" });
}

// Part P (2026-09-16): correcting a PRIVATE Food's own macros by hand — only
// ever the OWNING user's own non-authoritative Food. A global/authoritative
// catalog Food (bls/usda_fdc/open_food_facts/web_evidence/manufacturer/
// open_database/barcode/ai_ocr) can NEVER be edited this way, regardless of
// what the client claims — both the ownership (createdById) and the
// source-editability check are enforced here, server-side, against the
// actually-persisted row, never trusted from the request.
const EDITABLE_PRIVATE_FOOD_SOURCES = new Set(["ai_estimated", "user_input"]);

export type EditPrivateFoodPrisma = Pick<PrismaClient, "food">;

/**
 * Editing an ai_estimated Food's values transitions its source to
 * user_input — once a human has corrected/confirmed the numbers by hand,
 * this must never keep reading as "the AI's own estimate" (Part P's exact
 * requirement). The previous source and an edit timestamp are preserved in
 * provenance for audit, never silently discarded.
 */
export async function editPrivateFood(prisma: EditPrivateFoodPrisma, userId: string, foodId: string, input: EditPrivateFoodInput) {
  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food || food.createdById !== userId) throw foodNotFoundError();
  if (!EDITABLE_PRIVATE_FOOD_SOURCES.has(food.source)) throw foodNotEditableError();
  const existingProvenance = (food.provenance && typeof food.provenance === "object" && !Array.isArray(food.provenance)) ? food.provenance as Record<string, unknown> : {};
  return prisma.food.update({
    where: { id: food.id },
    data: {
      ...(input.name ? { name: input.name, originalName: input.name } : {}),
      kcalPer100g: input.kcalPer100g, fatPer100g: input.fatPer100g, proteinPer100g: input.proteinPer100g,
      carbsPer100g: input.carbsPer100g, fiberPer100g: input.fiberPer100g,
      source: "user_input",
      provenance: { ...existingProvenance, method: "user_edited", editedAt: new Date().toISOString(), previousSource: food.source }
    }
  });
}
