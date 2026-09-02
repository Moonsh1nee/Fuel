export interface ShoppingListIngredientInput {
  name: string;
  grams: number; // already scaled by (menuEntry.servings / recipe.servings) by the caller
}

export interface ShoppingListItem {
  name: string;
  totalGrams: number;
}

/**
 * Aggregates ingredient quantities by exact normalized name (trim +
 * lowercase) - no fuzzy matching, so "Молоко" and "молоко 3.2%" stay
 * separate line items. Mitigated on the input side: recipe ingredient
 * names are editable, not locked to whatever a food search returned, so
 * normalizing names at recipe-authoring time is the practical lever here.
 */
export function computeShoppingList(ingredients: ShoppingListIngredientInput[]): ShoppingListItem[] {
  const byKey = new Map<string, ShoppingListItem>();

  for (const ingredient of ingredients) {
    const key = ingredient.name.trim().toLowerCase();
    if (!key) continue;

    const existing = byKey.get(key);
    if (existing) {
      existing.totalGrams += ingredient.grams;
    } else {
      byKey.set(key, { name: ingredient.name.trim(), totalGrams: ingredient.grams });
    }
  }

  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name, "ru"));
}
