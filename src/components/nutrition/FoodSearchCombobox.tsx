"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NormalizedFood } from "@/lib/food-search";

export function FoodSearchCombobox({ onSelect }: { onSelect: (food: NormalizedFood) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [isPending, startTransition] = useTransition();

  const search = () => {
    if (!query.trim()) return;
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
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
          {results.map((food, i) => (
            <button
              key={`${food.barcode ?? food.name}-${i}`}
              type="button"
              onClick={() => {
                onSelect(food);
                setResults([]);
                setQuery("");
              }}
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
