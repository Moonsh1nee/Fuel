import { describe, it, expect } from "vitest";
import { computeCompositeMacros, type CompositeComponentInput } from "./composite-food-calc";

const COFFEE: CompositeComponentInput = {
  grams: 200,
  per100g: { caloriesPer100g: 40, proteinPer100g: 3.5, carbsPer100g: 4.9, fatPer100g: 1.2 },
};

const MILK: CompositeComponentInput = {
  grams: 100,
  per100g: { caloriesPer100g: 42, proteinPer100g: 3.4, carbsPer100g: 4.8, fatPer100g: 1.0 },
};

describe("computeCompositeMacros", () => {
  it("sums a coffee+milk combo to hand-computed per-100g totals", () => {
    const result = computeCompositeMacros([COFFEE, MILK]);
    expect(result.totalGrams).toBe(300);
    // absolute: coffee 200g -> {80, 7, 9.8, 2.4}; milk 100g -> {42, 3.4, 4.8, 1.0}
    // sum -> {122, 10.4, 14.6, 3.4}; per-100g of 300g total -> divide by 3
    expect(result.per100g).toEqual({
      caloriesPer100g: 41,
      proteinPer100g: 3.5,
      carbsPer100g: 4.9,
      fatPer100g: 1.1,
    });
  });

  it("returns the same per-100g values for a single component (passthrough)", () => {
    const single: CompositeComponentInput = {
      grams: 150,
      per100g: { caloriesPer100g: 50, proteinPer100g: 2, carbsPer100g: 10, fatPer100g: 3 },
    };
    const result = computeCompositeMacros([single]);
    expect(result.totalGrams).toBe(150);
    expect(result.per100g).toEqual({
      caloriesPer100g: 50,
      proteinPer100g: 2,
      carbsPer100g: 10,
      fatPer100g: 3,
    });
  });

  it("returns a null-filled result for zero total grams instead of NaN", () => {
    const result = computeCompositeMacros([]);
    expect(result.totalGrams).toBe(0);
    expect(result.per100g).toEqual({
      caloriesPer100g: null,
      proteinPer100g: null,
      carbsPer100g: null,
      fatPer100g: null,
    });
  });

  it("treats a component's null macro fields as zero contribution, not a crash", () => {
    const sparse: CompositeComponentInput = {
      grams: 100,
      per100g: { caloriesPer100g: 40, proteinPer100g: null, carbsPer100g: null, fatPer100g: null },
    };
    const result = computeCompositeMacros([sparse, MILK]);
    expect(Number.isNaN(result.per100g.proteinPer100g)).toBe(false);
    // milk alone contributes all the protein/carbs/fat, coffee-substitute contributes 0
    expect(result.totalGrams).toBe(200);
  });

  it("generalizes to three or more components", () => {
    const sugar: CompositeComponentInput = {
      grams: 10,
      per100g: { caloriesPer100g: 400, proteinPer100g: 0, carbsPer100g: 100, fatPer100g: 0 },
    };
    const result = computeCompositeMacros([COFFEE, MILK, sugar]);
    expect(result.totalGrams).toBe(310);
    expect(result.per100g.caloriesPer100g).not.toBeNull();
    expect(result.per100g.carbsPer100g).toBeGreaterThan(4.9); // sugar pulls carbs up vs coffee+milk alone
  });
});
