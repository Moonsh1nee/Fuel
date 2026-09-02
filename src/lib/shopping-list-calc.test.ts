import { describe, it, expect } from "vitest";
import { computeShoppingList } from "./shopping-list-calc";

describe("computeShoppingList", () => {
  it("returns an empty list for empty input", () => {
    expect(computeShoppingList([])).toEqual([]);
  });

  it("merges the same ingredient name regardless of case/whitespace variance", () => {
    const result = computeShoppingList([
      { name: "Молоко", grams: 200 },
      { name: " молоко ", grams: 100 },
      { name: "МОЛОКО", grams: 50 },
    ]);
    expect(result).toEqual([{ name: "Молоко", totalGrams: 350 }]);
  });

  it("keeps near-duplicate-but-not-identical names as separate items (documented v1 limitation)", () => {
    const result = computeShoppingList([
      { name: "Молоко", grams: 200 },
      { name: "молоко 3.2%", grams: 200 },
    ]);
    expect(result).toHaveLength(2);
  });

  it("sorts the result alphabetically (ru locale)", () => {
    const result = computeShoppingList([
      { name: "Яблоко", grams: 100 },
      { name: "Банан", grams: 100 },
      { name: "Ёж", grams: 1 },
    ]);
    expect(result.map((r) => r.name)).toEqual(["Банан", "Ёж", "Яблоко"]);
  });

  it("passes a single ingredient through unchanged", () => {
    expect(computeShoppingList([{ name: "Рис", grams: 150 }])).toEqual([
      { name: "Рис", totalGrams: 150 },
    ]);
  });

  it("ignores an ingredient with a blank name instead of producing an empty-key item", () => {
    const result = computeShoppingList([{ name: "   ", grams: 100 }, { name: "Соль", grams: 5 }]);
    expect(result).toEqual([{ name: "Соль", totalGrams: 5 }]);
  });
});
