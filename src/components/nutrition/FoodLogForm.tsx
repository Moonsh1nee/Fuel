"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createFoodLog } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FoodSearchCombobox } from "@/components/nutrition/FoodSearchCombobox";
import type { NormalizedFood } from "@/lib/food-search";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

export function FoodLogForm({ date, onAdded }: { date: Date; onAdded: () => void }) {
  const [mealType, setMealType] = useState("BREAKFAST");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isPending, startTransition] = useTransition();

  const applyFood = (food: NormalizedFood) => {
    setName(food.name);
    if (food.caloriesPer100g !== null) setCalories(String(Math.round(food.caloriesPer100g)));
    if (food.proteinPer100g !== null) setProtein(String(food.proteinPer100g));
    if (food.carbsPer100g !== null) setCarbs(String(food.carbsPer100g));
    if (food.fatPer100g !== null) setFat(String(food.fatPer100g));
  };

  const reset = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const onSubmit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createFoodLog({
          date,
          mealType,
          name: name.trim(),
          calories: calories ? Number(calories) : undefined,
          protein: protein ? Number(protein) : undefined,
          carbs: carbs ? Number(carbs) : undefined,
          fat: fat ? Number(fat) : undefined,
        });
        toast.success("Запись добавлена");
        reset();
        onAdded();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось добавить запись");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавить запись</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FoodSearchCombobox onSelect={applyFood} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
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
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Калории</Label>
            <Input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Белки, г</Label>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Углеводы, г</Label>
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Жиры, г</Label>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>

        <Button type="button" disabled={isPending || !name.trim()} onClick={onSubmit}>
          {isPending ? "Добавление..." : "Добавить"}
        </Button>
      </CardContent>
    </Card>
  );
}
