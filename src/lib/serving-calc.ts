export interface MacrosPer100g {
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
}

export interface ScaledMacros {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

/**
 * Scales per-100g macro values by the actual grams eaten. Calories round to
 * a whole number (matches FoodLog.calories: Int?); protein/carbs/fat round
 * to 1 decimal (matches the Float? fields) to avoid ugly floating-point
 * tails like 12.000000000000002.
 */
export function scaleMacrosByGrams(per100g: MacrosPer100g, grams: number): ScaledMacros {
  const factor = grams / 100;
  const scaleInt = (v: number | null) => (v === null ? null : Math.round(v * factor));
  const scaleDecimal = (v: number | null) => (v === null ? null : Math.round(v * factor * 10) / 10);

  return {
    calories: scaleInt(per100g.caloriesPer100g),
    protein: scaleDecimal(per100g.proteinPer100g),
    carbs: scaleDecimal(per100g.carbsPer100g),
    fat: scaleDecimal(per100g.fatPer100g),
  };
}

export interface AbsoluteMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Sums the absolute macros of a set of weighted components (each scaled by
 * its own grams). Shared by computeCompositeMacros (divides by total weight)
 * and computeRecipeMacrosPerServing (divides by serving count) - the sum
 * itself is identical, only the final denominator differs.
 */
export function sumAbsoluteMacros(components: { grams: number; per100g: MacrosPer100g }[]): AbsoluteMacros {
  return components.reduce(
    (acc, c) => {
      const scaled = scaleMacrosByGrams(c.per100g, c.grams);
      return {
        calories: acc.calories + (scaled.calories ?? 0),
        protein: acc.protein + (scaled.protein ?? 0),
        carbs: acc.carbs + (scaled.carbs ?? 0),
        fat: acc.fat + (scaled.fat ?? 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
