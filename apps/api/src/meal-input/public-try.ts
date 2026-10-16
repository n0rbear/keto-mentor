import type { PrismaClient } from "@prisma/client";
import { scaleMacros, type MacroTotals } from "../nutrition-core.js";
import { calculateRecipeNutrition, type RecipeWithIngredients } from "../recipes/nutrition.js";
import { findReferenceRecipes } from "../reference-dishes/lookup.js";
import { referenceVariantIdsFor } from "../reference-dishes/lookup.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { withoutLeadingAmount } from "./local-recipe-lookup.js";
import type { InterpretResult } from "./interpret.js";

// "Próbáld ki regisztráció nélkül" (owner tier decision 2026-10-15): anyone
// types what they intend to eat and sees its nutrition. Nothing is stored and
// nothing is tied to a person; the answer is computed and returned only.

export type TryItem = {
  name: string;
  grams: number | null;
  status: "ok" | "estimated" | "assumed_100g" | "unclear";
  macros: MacroTotals | null;
  alternatives?: string[];
};
export type TryResult = { items: TryItem[]; totals: MacroTotals; source: "reference_dish" | "foods" };

const r1 = (v: number) => Math.round(v * 10) / 10;
const round = (m: MacroTotals): MacroTotals => ({ kcal: Math.round(m.kcal), fat: r1(m.fat), protein: r1(m.protein), carbs: r1(m.carbs), fiber: r1(m.fiber), netCarbs: r1(m.netCarbs) });
const sum = (items: TryItem[]): MacroTotals => round(items.reduce((a, i) => i.macros ? { kcal: a.kcal + i.macros.kcal, fat: a.fat + i.macros.fat, protein: a.protein + i.macros.protein, carbs: a.carbs + i.macros.carbs, fiber: a.fiber + i.macros.fiber, netCarbs: a.netCarbs + i.macros.netCarbs } : a, { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 }));
const nameOf = (food: { name: string; names?: Record<string, string> | null }, lang: string) => food.names?.[lang] || food.names?.hu || food.name;

/** A known dish ("pörkölt nokedlivel", "2 adag rakott karfiol"): its reviewed reference recipe, one serving per portion. */
export async function tryReferenceDish(prisma: Pick<PrismaClient, "recipe">, text: string, lang: string): Promise<TryResult | null> {
  const dish = withoutLeadingAmount(text);
  const ids = referenceVariantIdsFor(dish);
  if (!ids.length) return null;
  const rows = await findReferenceRecipes<any>(prisma, ids, { ingredients: { include: { food: true } } });
  if (!rows.length) return null;
  const parsed = parseNaturalFoodQuery(text);
  // Only portions/plates/bowls count as servings of a dish; pieces or grams do not.
  const portions = parsed.quantity && (!parsed.unit || ["portion", "plate", "bowl"].includes(parsed.unit)) ? parsed.quantity : 1;
  const titleOf = (row: any) => (row.provenance?.titles?.[lang] as string | undefined) ?? row.title;
  const row = rows[0];
  const nutrition = calculateRecipeNutrition({ ...row, servings: row.servings || 1 } as RecipeWithIngredients);
  const perServing = nutrition.perServing?.macros;
  if (!perServing) return null;
  const grams = (row.finishedWeightGrams ?? 0) * portions || null;
  const macros = round({ ...perServing, kcal: perServing.kcal * portions, fat: perServing.fat * portions, protein: perServing.protein * portions, carbs: perServing.carbs * portions, fiber: perServing.fiber * portions, netCarbs: perServing.netCarbs * portions });
  const item: TryItem = { name: titleOf(row), grams: grams ? Math.round(grams) : null, status: "ok", macros, alternatives: rows.length > 1 ? rows.slice(1, 4).map(titleOf) : undefined };
  return { items: [item], totals: sum([item]), source: "reference_dish" };
}

/** Turns an interpreter result into amounts and nutrition, without saving anything. */
export function tryFromInterpretation(result: InterpretResult, lang: string): TryResult {
  const rows = result.items ?? [result];
  const items: TryItem[] = rows.map((row) => {
    const food = row.selectedFood as any;
    if (!food || row.foodResolution === "unresolved" || food.kcalPer100g == null) {
      return { name: row.parsed?.foodQuery || result.input, grams: null, status: "unclear", macros: null };
    }
    const per100 = { kcal: food.kcalPer100g, fat: food.fatPer100g, protein: food.proteinPer100g, carbs: food.carbsPer100g, fiber: food.fiberPer100g ?? 0 };
    const q = row.quantity;
    const grams = q?.status === "resolved" && q.grams ? q.grams : null;
    const used = grams ?? 100;
    const alternatives = (row.candidates ?? []).filter((c: any) => c.id !== food.id).slice(0, 3).map((c: any) => nameOf(c, lang));
    return {
      name: nameOf(food, lang), grams: Math.round(used),
      status: grams == null ? "assumed_100g" : q?.estimated ? "estimated" : "ok",
      macros: round(scaleMacros(per100, used / 100)),
      alternatives: row.ambiguous && alternatives.length ? alternatives : undefined
    };
  });
  return { items, totals: sum(items), source: "foods" };
}
