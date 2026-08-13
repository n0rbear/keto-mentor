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
