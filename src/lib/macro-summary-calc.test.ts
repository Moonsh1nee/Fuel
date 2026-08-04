import { describe, it, expect } from "vitest";
import { computeMacroSummary } from "@/lib/macro-summary-calc";

describe("computeMacroSummary", () => {
  it("sums calories/protein/carbs/fat across entries", () => {
    const summary = computeMacroSummary([
      { calories: 300, protein: 20, carbs: 30, fat: 10 },
      { calories: 500, protein: 40, carbs: 50, fat: 15 },
    ]);

    expect(summary).toEqual({
      totalCalories: 800,
      totalProtein: 60,
      totalCarbs: 80,
      totalFat: 25,
      entriesCount: 2,
    });
  });

  it("treats null macro fields as zero", () => {
    const summary = computeMacroSummary([{ calories: 200, protein: null, carbs: null, fat: null }]);

    expect(summary.totalCalories).toBe(200);
    expect(summary.totalProtein).toBe(0);
    expect(summary.totalCarbs).toBe(0);
    expect(summary.totalFat).toBe(0);
  });

  it("returns zeroed summary for an empty entry list", () => {
    expect(computeMacroSummary([])).toEqual({
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      entriesCount: 0,
    });
  });
});
