import { describe, it, expect } from "vitest";
import { scaleMacrosByGrams, type MacrosPer100g } from "./serving-calc";

const COFFEE: MacrosPer100g = {
  caloriesPer100g: 40,
  proteinPer100g: 3.5,
  carbsPer100g: 4.9,
  fatPer100g: 1.2,
};

describe("scaleMacrosByGrams", () => {
  it("returns the per-100g values unchanged for exactly 100g", () => {
    expect(scaleMacrosByGrams(COFFEE, 100)).toEqual({
      calories: 40,
      protein: 3.5,
      carbs: 4.9,
      fat: 1.2,
    });
  });

  it("scales down proportionally for a smaller portion", () => {
    expect(scaleMacrosByGrams(COFFEE, 50)).toEqual({
      calories: 20,
      protein: 1.8, // 3.5 * 0.5 = 1.75 -> rounds to 1.8
      carbs: 2.5, // 4.9 * 0.5 = 2.45 -> rounds to 2.5
      fat: 0.6,
    });
  });

  it("scales up proportionally for a larger portion", () => {
    expect(scaleMacrosByGrams(COFFEE, 250)).toEqual({
      calories: 100,
      protein: 8.8, // 3.5 * 2.5 = 8.75 -> rounds to 8.8
      carbs: 12.3, // 4.9 * 2.5 = 12.25 -> rounds to 12.3
      fat: 3,
    });
  });

  it("returns all zeros for 0 grams, not NaN", () => {
    expect(scaleMacrosByGrams(COFFEE, 0)).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("passes through null fields as null regardless of grams", () => {
    const partial: MacrosPer100g = {
      caloriesPer100g: 40,
      proteinPer100g: null,
      carbsPer100g: null,
      fatPer100g: null,
    };
    expect(scaleMacrosByGrams(partial, 137)).toEqual({
      calories: 55, // 40 * 1.37 = 54.8 -> rounds to 55
      protein: null,
      carbs: null,
      fat: null,
    });
  });

  it("rounds calories to a whole number and macros to 1 decimal at odd grams", () => {
    const result = scaleMacrosByGrams(COFFEE, 137);
    expect(Number.isInteger(result.calories)).toBe(true);
    expect(result.protein).toBe(4.8); // 3.5 * 1.37 = 4.795 -> rounds to 4.8
  });
});
