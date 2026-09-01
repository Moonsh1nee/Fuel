import { scaleMacrosByGrams, type MacrosPer100g } from "@/lib/serving-calc";

export interface CompositeComponentInput {
  grams: number;
  per100g: MacrosPer100g;
}

export interface CompositeTotals {
  totalGrams: number;
  per100g: MacrosPer100g;
}

/**
 * Sums each component's absolute macros (scaled by its own grams), then
 * converts the total back to "per 100g of the combined food" so the result
 * can be stored/used exactly like any other per-100g source.
 */
export function computeCompositeMacros(components: CompositeComponentInput[]): CompositeTotals {
  const totalGrams = components.reduce((sum, c) => sum + c.grams, 0);

  if (totalGrams === 0) {
    return {
      totalGrams: 0,
      per100g: { caloriesPer100g: null, proteinPer100g: null, carbsPer100g: null, fatPer100g: null },
    };
  }

  const absolute = components.reduce(
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

  const factor = 100 / totalGrams;
  return {
    totalGrams,
    per100g: {
      caloriesPer100g: Math.round(absolute.calories * factor),
      proteinPer100g: Math.round(absolute.protein * factor * 10) / 10,
      carbsPer100g: Math.round(absolute.carbs * factor * 10) / 10,
      fatPer100g: Math.round(absolute.fat * factor * 10) / 10,
    },
  };
}
