import { describe, it, expect } from "vitest";
import { buildMonthMenu, type RecipeCandidate, type BuildMonthMenuInput } from "./menu-generation";
import { mulberry32 } from "./seeded-rng";

function makeRecipe(id: string, calories = 400): RecipeCandidate {
  return { id, caloriesPerServing: calories, proteinPerServing: 20, carbsPerServing: 40, fatPerServing: 10 };
}

function baseInput(overrides: Partial<BuildMonthMenuInput> = {}): BuildMonthMenuInput {
  return {
    daysInMonth: 30,
    mealSlots: ["BREAKFAST", "LUNCH", "DINNER"],
    recipesBySlot: {
      BREAKFAST: [makeRecipe("b1"), makeRecipe("b2"), makeRecipe("b3"), makeRecipe("b4"), makeRecipe("b5")],
      LUNCH: [makeRecipe("l1"), makeRecipe("l2"), makeRecipe("l3"), makeRecipe("l4"), makeRecipe("l5")],
      DINNER: [makeRecipe("d1"), makeRecipe("d2"), makeRecipe("d3"), makeRecipe("d4"), makeRecipe("d5")],
    },
    targets: null,
    cooldownDays: 3,
    rng: mulberry32(42),
    ...overrides,
  };
}

describe("buildMonthMenu", () => {
  it("skips an empty-pool slot for every day, warns once, leaves other slots unaffected", () => {
    const result = buildMonthMenu(baseInput({ recipesBySlot: { ...baseInput().recipesBySlot, BREAKFAST: [] } }));
    expect(result.entries.some((e) => e.mealType === "BREAKFAST")).toBe(false);
    expect(result.warnings).toEqual([{ mealType: "BREAKFAST", reason: "empty_pool", poolSize: 0 }]);
    expect(result.entries.filter((e) => e.mealType === "LUNCH")).toHaveLength(30);
    expect(result.entries.filter((e) => e.mealType === "DINNER")).toHaveLength(30);
  });

  it("returns an empty entry list with one warning per slot when every pool is empty, without throwing", () => {
    const result = buildMonthMenu(
      baseInput({ recipesBySlot: { BREAKFAST: [], LUNCH: [], DINNER: [] } }),
    );
    expect(result.entries).toEqual([]);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.every((w) => w.reason === "empty_pool")).toBe(true);
  });

  it("relaxes the cooldown and warns when the pool is <= cooldownDays, but never repeats immediately with 2+ recipes", () => {
    const result = buildMonthMenu(
      baseInput({
        mealSlots: ["BREAKFAST"],
        recipesBySlot: { BREAKFAST: [makeRecipe("b1"), makeRecipe("b2")] },
        cooldownDays: 3,
      }),
    );
    expect(result.warnings).toEqual([{ mealType: "BREAKFAST", reason: "small_pool", poolSize: 2 }]);
    const picks = result.entries.map((e) => e.recipeId);
    expect(picks).toHaveLength(30);
    for (let i = 1; i < picks.length; i++) {
      expect(picks[i]).not.toBe(picks[i - 1]);
    }
  });

  it("uses the single available recipe every day when the pool has exactly one", () => {
    const result = buildMonthMenu(
      baseInput({ mealSlots: ["BREAKFAST"], recipesBySlot: { BREAKFAST: [makeRecipe("only")] } }),
    );
    expect(result.warnings).toEqual([{ mealType: "BREAKFAST", reason: "single_recipe", poolSize: 1 }]);
    expect(result.entries.every((e) => e.recipeId === "only")).toBe(true);
    expect(result.entries).toHaveLength(30);
  });

  it("uses servings=1 for every entry when no targets are set, with no scaling attempted", () => {
    const result = buildMonthMenu(baseInput({ targets: null }));
    expect(result.entries.every((e) => e.servings === 1)).toBe(true);
  });

  it("produces the right entry count and clamped/quarter-stepped servings when targets are set", () => {
    const result = buildMonthMenu(
      baseInput({ targets: { calories: 1500, protein: null, carbs: null, fat: null } }),
    );
    expect(result.entries).toHaveLength(30 * 3);
    for (const entry of result.entries) {
      expect(entry.servings).toBeGreaterThanOrEqual(0.75);
      expect(entry.servings).toBeLessThanOrEqual(1.5);
      expect((entry.servings * 4) % 1).toBe(0); // multiple of 0.25
    }
  });

  it("is fully deterministic - same seed and inputs produce byte-identical output twice", () => {
    const resultA = buildMonthMenu(baseInput({ rng: mulberry32(7) }));
    const resultB = buildMonthMenu(baseInput({ rng: mulberry32(7) }));
    expect(resultA).toEqual(resultB);
  });

  it("produces the correct entry count across daysInMonth edge values (28/29/30/31)", () => {
    for (const daysInMonth of [28, 29, 30, 31]) {
      const result = buildMonthMenu(baseInput({ daysInMonth, rng: mulberry32(1) }));
      expect(result.entries).toHaveLength(daysInMonth * 3);
    }
  });

  it("never repeats a recipe within any window of cooldownDays when the pool is ample", () => {
    const pool = Array.from({ length: 20 }, (_, i) => makeRecipe(`r${i}`));
    const result = buildMonthMenu(
      baseInput({
        mealSlots: ["BREAKFAST"],
        recipesBySlot: { BREAKFAST: pool },
        cooldownDays: 7,
        daysInMonth: 31,
      }),
    );
    expect(result.warnings).toEqual([]);
    const picks = result.entries.map((e) => e.recipeId);
    for (let i = 0; i < picks.length; i++) {
      const windowStart = Math.max(0, i - 6);
      const window = picks.slice(windowStart, i);
      expect(window).not.toContain(picks[i]);
    }
  });
});
