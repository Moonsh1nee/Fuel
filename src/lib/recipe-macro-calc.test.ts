import { describe, it, expect } from "vitest";
import { computeRecipeMacrosPerServing, type RecipeIngredientInput } from "./recipe-macro-calc";
import { scaleMacrosByGrams } from "./serving-calc";

const CHICKEN: RecipeIngredientInput = {
  grams: 300,
  per100g: { caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
};

const RICE: RecipeIngredientInput = {
  grams: 200,
  per100g: { caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
};

describe("computeRecipeMacrosPerServing", () => {
  it("returns all null for an empty ingredient list", () => {
    expect(computeRecipeMacrosPerServing([], 4)).toEqual({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it("returns all null for zero or negative servings, not a division-by-zero crash", () => {
    expect(computeRecipeMacrosPerServing([CHICKEN], 0)).toEqual({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
    expect(computeRecipeMacrosPerServing([CHICKEN], -2)).toEqual({
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it("matches scaleMacrosByGrams exactly for a single ingredient at servings=1", () => {
    const single: RecipeIngredientInput = {
      grams: 150,
      per100g: { caloriesPer100g: 50, proteinPer100g: 2, carbsPer100g: 10, fatPer100g: 3 },
    };
    expect(computeRecipeMacrosPerServing([single], 1)).toEqual(
      scaleMacrosByGrams(single.per100g, single.grams),
    );
  });

  it("sums multiple ingredients and divides by the serving count, with correct rounding", () => {
    // absolute: chicken 300g -> {495, 93, 0, 10.8}; rice 200g -> {260, 5.4, 56, 0.6}
    // sum -> {755, 98.4, 56, 11.4}; divide by 4 servings
    const result = computeRecipeMacrosPerServing([CHICKEN, RICE], 4);
    expect(result).toEqual({
      calories: 189, // 755/4 = 188.75 -> rounds to 189
      protein: 24.6, // 98.4/4 = 24.6
      carbs: 14,
      fat: 2.9, // 11.4/4 = 2.85 -> rounds to 2.9
    });
  });

  it("treats a component's null macro fields as zero contribution, not a crash", () => {
    const sparse: RecipeIngredientInput = {
      grams: 100,
      per100g: { caloriesPer100g: 40, proteinPer100g: null, carbsPer100g: null, fatPer100g: null },
    };
    const result = computeRecipeMacrosPerServing([sparse, RICE], 2);
    expect(Number.isNaN(result.protein)).toBe(false);
    expect(result.calories).not.toBeNull();
  });
});
