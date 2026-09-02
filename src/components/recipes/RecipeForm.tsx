"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FoodSearchCombobox } from "@/components/nutrition/FoodSearchCombobox";
import { createRecipe, updateRecipe } from "@/lib/actions/recipes";
import { computeRecipeMacrosPerServing } from "@/lib/recipe-macro-calc";
import type { NormalizedFood } from "@/lib/food-search";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

interface IngredientRow {
  food: NormalizedFood | null;
  name: string;
  grams: string;
}

const emptyRow = (): IngredientRow => ({ food: null, name: "", grams: "" });

export interface RecipeFormInitial {
  id: string;
  name: string;
  description: string | null;
  mealType: string;
  servings: number;
  instructions: string;
  prepMinutes: number | null;
  cookMinutes: number | null;
  ingredients: {
    name: string;
    grams: number;
    caloriesPer100g: number | null;
    proteinPer100g: number | null;
    carbsPer100g: number | null;
    fatPer100g: number | null;
  }[];
}

export function RecipeForm({
  initialRecipe,
  onSaved,
  onCancel,
}: {
  initialRecipe?: RecipeFormInitial;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(initialRecipe);

  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [description, setDescription] = useState(initialRecipe?.description ?? "");
  const [mealType, setMealType] = useState(initialRecipe?.mealType ?? "BREAKFAST");
  const [servings, setServings] = useState(String(initialRecipe?.servings ?? 4));
  const [prepMinutes, setPrepMinutes] = useState(
    initialRecipe?.prepMinutes != null ? String(initialRecipe.prepMinutes) : "",
  );
  const [cookMinutes, setCookMinutes] = useState(
    initialRecipe?.cookMinutes != null ? String(initialRecipe.cookMinutes) : "",
  );
  const [instructions, setInstructions] = useState(initialRecipe?.instructions ?? "");
  const [rows, setRows] = useState<IngredientRow[]>(
    initialRecipe
      ? initialRecipe.ingredients.map((i) => ({
          food: {
            barcode: null,
            name: i.name,
            caloriesPer100g: i.caloriesPer100g,
            proteinPer100g: i.proteinPer100g,
            carbsPer100g: i.carbsPer100g,
            fatPer100g: i.fatPer100g,
          },
          name: i.name,
          grams: String(i.grams),
        }))
      : [emptyRow()],
  );
  const [isPending, startTransition] = useTransition();

  const updateRow = (index: number, patch: Partial<IngredientRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const preview = useMemo(() => {
    const valid = rows
      .filter((row) => row.food && Number(row.grams) > 0)
      .map((row) => ({
        grams: Number(row.grams),
        per100g: {
          caloriesPer100g: row.food!.caloriesPer100g,
          proteinPer100g: row.food!.proteinPer100g,
          carbsPer100g: row.food!.carbsPer100g,
          fatPer100g: row.food!.fatPer100g,
        },
      }));
    if (valid.length === 0) return null;
    const servingsNum = Number(servings) || 1;
    return computeRecipeMacrosPerServing(valid, servingsNum);
  }, [rows, servings]);

  const onSubmit = () => {
    const ingredients = rows
      .filter((row) => row.food && row.name.trim() && Number(row.grams) > 0)
      .map((row) => ({
        name: row.name.trim(),
        grams: Number(row.grams),
        caloriesPer100g: row.food!.caloriesPer100g ?? undefined,
        proteinPer100g: row.food!.proteinPer100g ?? undefined,
        carbsPer100g: row.food!.carbsPer100g ?? undefined,
        fatPer100g: row.food!.fatPer100g ?? undefined,
      }));

    if (!name.trim() || !instructions.trim() || ingredients.length === 0) {
      toast.error("Укажи название, шаги приготовления и хотя бы один ингредиент");
      return;
    }

    const input = {
      name: name.trim(),
      description: description.trim() || undefined,
      mealType,
      servings: Number(servings) || 1,
      instructions: instructions.trim(),
      prepMinutes: prepMinutes ? Number(prepMinutes) : undefined,
      cookMinutes: cookMinutes ? Number(cookMinutes) : undefined,
      ingredients,
    };

    startTransition(async () => {
      try {
        if (isEdit && initialRecipe) {
          await updateRecipe(initialRecipe.id, input);
          toast.success("Рецепт обновлён");
        } else {
          await createRecipe(input);
          toast.success("Рецепт сохранён");
          setName("");
          setDescription("");
          setMealType("BREAKFAST");
          setServings("4");
          setPrepMinutes("");
          setCookMinutes("");
          setInstructions("");
          setRows([emptyRow()]);
        }
        onSaved();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить рецепт");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Редактировать рецепт" : "Новый рецепт"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Куриная грудка с рисом" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Описание</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label>Приём пищи</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MEAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Порций</Label>
            <Input type="number" value={servings} onChange={(e) => setServings(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Подготовка, мин</Label>
            <Input type="number" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Готовка, мин</Label>
            <Input type="number" value={cookMinutes} onChange={(e) => setCookMinutes(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Ингредиенты</Label>
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_5rem_auto] items-end gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Поиск</Label>
                <FoodSearchCombobox
                  onSelect={(food) => updateRow(index, { food, name: food.name })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Название в списке покупок</Label>
                <Input value={row.name} onChange={(e) => updateRow(index, { name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Граммы</Label>
                <Input
                  type="number"
                  value={row.grams}
                  onChange={(e) => updateRow(index, { grams: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                disabled={rows.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
          >
            <Plus className="h-3.5 w-3.5" /> Ингредиент
          </Button>
        </div>

        {preview && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            На порцию: {preview.calories ?? 0} ккал · Б {preview.protein ?? 0} · У {preview.carbs ?? 0} · Ж{" "}
            {preview.fat ?? 0}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Шаги приготовления</Label>
          <Textarea
            rows={6}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"1. ...\n2. ...\n3. ..."}
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" disabled={isPending} onClick={onSubmit}>
            {isPending ? "Сохранение..." : isEdit ? "Сохранить изменения" : "Сохранить рецепт"}
          </Button>
          {isEdit && onCancel && (
            <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
