"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createFoodLog } from "@/lib/actions/nutrition";
import { scaleMacrosByGrams, type MacrosPer100g } from "@/lib/serving-calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FoodSearchCombobox } from "@/components/nutrition/FoodSearchCombobox";
import { BarcodeScannerDialog } from "@/components/nutrition/BarcodeScannerDialog";
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
  const [source, setSource] = useState<MacrosPer100g | null>(null);
  const [grams, setGrams] = useState("100");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const applyFood = (food: NormalizedFood) => {
    setName(food.name);
    setSource({
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
    });
    setGrams("100");
  };

  const clearSource = () => {
    setSource(null);
    setGrams("100");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const reset = () => {
    setName("");
    setSource(null);
    setGrams("100");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const scaled = source ? scaleMacrosByGrams(source, Number(grams) || 0) : null;

  const onSubmit = () => {
    if (!name.trim()) return;

    const macros = scaled ?? {
      calories: calories ? Number(calories) : undefined,
      protein: protein ? Number(protein) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fat ? Number(fat) : undefined,
    };

    startTransition(async () => {
      try {
        await createFoodLog({
          date,
          mealType,
          name: name.trim(),
          calories: macros.calories ?? undefined,
          protein: macros.protein ?? undefined,
          carbs: macros.carbs ?? undefined,
          fat: macros.fat ?? undefined,
          gramsLogged: source ? Number(grams) || 0 : undefined,
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
        <div className="flex gap-2">
          <div className="flex-1">
            <FoodSearchCombobox onSelect={applyFood} />
          </div>
          <Button type="button" variant="outline" onClick={() => setScannerOpen(true)}>
            Штрихкод
          </Button>
        </div>

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

          {source ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>Граммы</Label>
                <Input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Калории</Label>
                <Input type="number" value={scaled?.calories ?? ""} readOnly disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Белки, г</Label>
                <Input type="number" value={scaled?.protein ?? ""} readOnly disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Углеводы, г</Label>
                <Input type="number" value={scaled?.carbs ?? ""} readOnly disabled />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Жиры, г</Label>
                <Input type="number" value={scaled?.fat ?? ""} readOnly disabled />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="col-span-2 self-start sm:col-span-3"
                onClick={clearSource}
              >
                Ввести вручную
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <Button type="button" disabled={isPending || !name.trim()} onClick={onSubmit}>
          {isPending ? "Добавление..." : "Добавить"}
        </Button>
      </CardContent>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onResolved={applyFood}
      />
    </Card>
  );
}
