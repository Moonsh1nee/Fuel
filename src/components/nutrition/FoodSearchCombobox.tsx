"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listCustomFoods } from "@/lib/actions/custom-foods";
import type { NormalizedFood } from "@/lib/food-search";
import type { CustomFoodItem } from "@/components/nutrition/CustomFoodsList";

function toNormalizedFood(food: CustomFoodItem): NormalizedFood {
  return {
    barcode: null,
    name: food.name,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
  };
}

export function FoodSearchCombobox({ onSelect }: { onSelect: (food: NormalizedFood) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [customFoods, setCustomFoods] = useState<CustomFoodItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listCustomFoods()
      .then(setCustomFoods)
      .catch(() => setCustomFoods([]));
  }, []);

  const matchingCustomFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customFoods.filter((f) => f.name.toLowerCase().includes(q));
  }, [customFoods, query]);

  const search = () => {
    if (!query.trim()) return;
    setSearched(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
          setResults([]);
          return;
        }
        const body = (await res.json()) as { results: NormalizedFood[] };
        setResults(body.results);
      } catch {
        setResults([]);
      }
    });
  };

  const select = (food: NormalizedFood) => {
    onSelect(food);
    setResults([]);
    setSearched(false);
    setQuery("");
  };

  const hasAnyResults = matchingCustomFoods.length > 0 || results.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Поиск продукта (Open Food Facts)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
        />
        <Button type="button" variant="outline" onClick={search} disabled={isPending}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
      {(matchingCustomFoods.length > 0 || (searched && hasAnyResults)) && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
          {matchingCustomFoods.length > 0 && (
            <>
              <span className="block px-3 py-1 text-xs font-medium text-muted-foreground">
                Мои продукты
              </span>
              {matchingCustomFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => select(toNormalizedFood(food))}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-muted"
                >
                  <span className="font-medium">{food.name}</span>
                  {food.caloriesPer100g !== null && (
                    <span className="text-xs text-muted-foreground">
                      {food.caloriesPer100g} ккал / 100г
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
          {results.map((food, i) => (
            <button
              key={`${food.barcode ?? food.name}-${i}`}
              type="button"
              onClick={() => select(food)}
              className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-muted"
            >
              <span className="font-medium">{food.name}</span>
              {food.caloriesPer100g !== null && (
                <span className="text-xs text-muted-foreground">
                  {food.caloriesPer100g} ккал / 100г
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
