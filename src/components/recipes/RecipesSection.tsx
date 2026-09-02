"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { RecipesList, type RecipeItem } from "@/components/recipes/RecipesList";
import { listRecipes } from "@/lib/actions/recipes";

export function RecipesSection() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listRecipes();
      setRecipes(fetched);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      {/* Keyed on the recipe id (or "new") so switching between create mode
          and editing a specific recipe - or between two different recipes -
          fully remounts the form, resetting its internal field state instead
          of reusing stale values from whatever was being edited before. */}
      <RecipeForm
        key={editingRecipe?.id ?? "new"}
        initialRecipe={editingRecipe ?? undefined}
        onSaved={() => {
          reload();
          setEditingRecipe(null);
        }}
        onCancel={() => setEditingRecipe(null)}
      />
      {isPending && recipes.length === 0 ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <RecipesList recipes={recipes} onChanged={reload} onEdit={setEditingRecipe} />
      )}
    </div>
  );
}
