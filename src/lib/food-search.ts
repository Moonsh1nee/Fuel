/**
 * Normalizes Open Food Facts API product responses into the shape Fuel's
 * food-log form needs. Ported from HabitForge's `_normalize_off_product`.
 */

export interface OffProduct {
  code?: string;
  product_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

export interface NormalizedFood {
  barcode: string | null;
  name: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
}

export function normalizeOffProduct(product: OffProduct): NormalizedFood | null {
  const name = product.product_name?.trim();
  if (!name) return null;

  const nutriments = product.nutriments ?? {};
  return {
    barcode: product.code ?? null,
    name,
    caloriesPer100g: nutriments["energy-kcal_100g"] ?? null,
    proteinPer100g: nutriments.proteins_100g ?? null,
    carbsPer100g: nutriments.carbohydrates_100g ?? null,
    fatPer100g: nutriments.fat_100g ?? null,
  };
}

export function normalizeOffProducts(products: OffProduct[]): NormalizedFood[] {
  return products
    .map(normalizeOffProduct)
    .filter((product): product is NormalizedFood => product !== null);
}
