"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteRecipe } from "@/lib/actions/recipes";
import { getActionErrorMessage } from "@/lib/action-error";
import type { RecipeFormInitial } from "@/components/recipes/RecipeForm";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

export interface RecipeItem {
  id: string;
  name: string;
  description: string | null;
  mealType: string;
  servings: number;
  instructions: string;
  prepMinutes: number | null;
  cookMinutes: number | null;
  caloriesPerServing: number | null;
  proteinPerServing: number | null;
  carbsPerServing: number | null;
  fatPerServing: number | null;
  ingredients: RecipeFormInitial["ingredients"];
}

export function RecipesList({
  recipes,
  onChanged,
  onEdit,
}: {
  recipes: RecipeItem[];
  onChanged: () => void;
  onEdit: (recipe: RecipeItem) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string, name: string) => {
    const confirmed = window.confirm(
      `Удалить рецепт «${name}»? Все связанные записи меню на любые месяцы тоже удалятся. Это нельзя отменить.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      try {
        await deleteRecipe(id);
        toast.success("Рецепт удалён");
        onChanged();
      } catch (err) {
        toast.error(getActionErrorMessage(err, "Не удалось удалить рецепт"));
      }
    });
  };

  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Рецептов пока нет
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {recipes.map((recipe) => (
        <Card key={recipe.id}>
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{recipe.name}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {MEAL_LABELS[recipe.mealType] ?? recipe.mealType}
                </span>
              </div>
              {recipe.description && (
                <span className="text-xs text-muted-foreground">{recipe.description}</span>
              )}
              <span className="text-xs text-muted-foreground">
                {recipe.servings} порц. · на порцию: {recipe.caloriesPerServing ?? 0} ккал · Б{" "}
                {recipe.proteinPerServing ?? 0} · У {recipe.carbsPerServing ?? 0} · Ж{" "}
                {recipe.fatPerServing ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit(recipe)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => onDelete(recipe.id, recipe.name)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
