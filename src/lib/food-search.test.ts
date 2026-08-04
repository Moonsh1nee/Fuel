import { describe, it, expect } from "vitest";
import { normalizeOffProduct, normalizeOffProducts } from "@/lib/food-search";

describe("normalizeOffProduct", () => {
  it("extracts name, barcode and per-100g macros", () => {
    const result = normalizeOffProduct({
      code: "1234567890123",
      product_name: "Овсяное молоко",
      nutriments: {
        "energy-kcal_100g": 45,
        proteins_100g: 0.5,
        carbohydrates_100g: 6.5,
        fat_100g: 1.5,
      },
    });

    expect(result).toEqual({
      barcode: "1234567890123",
      name: "Овсяное молоко",
      caloriesPer100g: 45,
      proteinPer100g: 0.5,
      carbsPer100g: 6.5,
      fatPer100g: 1.5,
    });
  });

  it("returns null when the product has no name", () => {
    expect(normalizeOffProduct({ code: "123" })).toBeNull();
    expect(normalizeOffProduct({ product_name: "  " })).toBeNull();
  });

  it("fills missing nutriment fields with null rather than throwing", () => {
    const result = normalizeOffProduct({ product_name: "Вода" });
    expect(result).toEqual({
      barcode: null,
      name: "Вода",
      caloriesPer100g: null,
      proteinPer100g: null,
      carbsPer100g: null,
      fatPer100g: null,
    });
  });
});

describe("normalizeOffProducts", () => {
  it("filters out unnamed products", () => {
    const results = normalizeOffProducts([
      { product_name: "Хлеб" },
      { code: "no-name" },
      { product_name: "Молоко" },
    ]);
    expect(results.map((r) => r.name)).toEqual(["Хлеб", "Молоко"]);
  });
});
