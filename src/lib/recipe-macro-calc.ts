import { sumAbsoluteMacros, type MacrosPer100g, type ScaledMacros } from "@/lib/serving-calc";

export interface RecipeIngredientInput {
  grams: number;
  per100g: MacrosPer100g;
}

/**
 * Sums each ingredient's absolute macros, then divides by the recipe's
 * SERVING COUNT - not by weight (unlike computeCompositeMacros, which
 * normalizes to per-100g of combined weight). A recipe is divided into N
 * portions regardless of how much each portion weighs.
 */
export function computeRecipeMacrosPerServing(
  ingredients: RecipeIngredientInput[],
  servings: number,
): ScaledMacros {
  if (ingredients.length === 0 || servings <= 0) {
    return { calories: null, protein: null, carbs: null, fat: null };
  }

  const absolute = sumAbsoluteMacros(ingredients);

  return {
    calories: Math.round(absolute.calories / servings),
    protein: Math.round((absolute.protein / servings) * 10) / 10,
    carbs: Math.round((absolute.carbs / servings) * 10) / 10,
    fat: Math.round((absolute.fat / servings) * 10) / 10,
  };
}
