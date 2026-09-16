export type MacroTotals = {
  kcal: number;
  fat: number;
  protein: number;
  carbs: number;
  fiber: number;
  netCarbs: number;
};

export const emptyMacros = (): MacroTotals => ({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });

export function scaleMacros(value: Omit<MacroTotals, "netCarbs">, factor: number): MacroTotals {
  const carbs = value.carbs * factor;
  const fiber = value.fiber * factor;
  return {
    kcal: value.kcal * factor,
    fat: value.fat * factor,
    protein: value.protein * factor,
    carbs,
    fiber,
    netCarbs: Math.max(0, carbs - fiber)
  };
}

export function addMacros(left: MacroTotals, right: MacroTotals): MacroTotals {
  return {
    kcal: left.kcal + right.kcal,
    fat: left.fat + right.fat,
    protein: left.protein + right.protein,
    carbs: left.carbs + right.carbs,
    fiber: left.fiber + right.fiber,
    netCarbs: left.netCarbs + right.netCarbs
  };
}

// Owner-beta checkpoint (2026-09-16) — final recipe nutrition review: a real,
// reproduced bug. scaleMacros recomputes netCarbs as max(0, carbs*factor -
// fiber*factor) — correct the FIRST time it's applied to a single
// ingredient's own raw per-100g values (an ingredient whose fiber exceeds its
// carbs SHOULD clamp to 0 there). But re-applying scaleMacros to an ALREADY-
// AGGREGATED MacroTotals (e.g. a whole-recipe total, itself the sum of
// per-ingredient-clamped netCarbs values) re-clamps a SECOND time from the
// aggregate's raw carbs/fiber — which is a different, smaller-or-equal
// number whenever any individual ingredient's own clamp actually fired
// (Σmax(0,cᵢ-fᵢ) ≥ max(0,Σcᵢ-Σfᵢ)). That made `total.netCarbs` and
// `perServing.netCarbs`/`per100g.netCarbs` silently disagree — the same
// recipe's own numbers wouldn't multiply/divide back into each other.
// scaleMacroTotals scales an already-computed total's netCarbs LINEARLY
// instead of re-deriving it, so downstream per-serving/per-100g/portion
// scaling can never re-clamp a total that was already clamped once, per
// ingredient, at accumulation time.
export function scaleMacroTotals(value: MacroTotals, factor: number): MacroTotals {
  return {
    kcal: value.kcal * factor,
    fat: value.fat * factor,
    protein: value.protein * factor,
    carbs: value.carbs * factor,
    fiber: value.fiber * factor,
    netCarbs: value.netCarbs * factor
  };
}
