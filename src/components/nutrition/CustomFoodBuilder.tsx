"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FoodSearchCombobox } from "@/components/nutrition/FoodSearchCombobox";
import { createCustomFood } from "@/lib/actions/custom-foods";
import { computeCompositeMacros } from "@/lib/composite-food-calc";
import { getActionErrorMessage } from "@/lib/action-error";
import type { NormalizedFood } from "@/lib/food-search";

interface ComponentRow {
  food: NormalizedFood | null;
  grams: string;
}

const emptyRow = (): ComponentRow => ({ food: null, grams: "" });

export function CustomFoodBuilder({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<ComponentRow[]>([emptyRow(), emptyRow()]);
  const [isPending, startTransition] = useTransition();

  const updateRow = (index: number, patch: Partial<ComponentRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const preview = useMemo(() => {
    const valid = rows
      .filter((row): row is ComponentRow & { food: NormalizedFood } => row.food !== null && Number(row.grams) > 0)
      .map((row) => ({
        grams: Number(row.grams),
        per100g: {
          caloriesPer100g: row.food.caloriesPer100g,
          proteinPer100g: row.food.proteinPer100g,
          carbsPer100g: row.food.carbsPer100g,
          fatPer100g: row.food.fatPer100g,
        },
      }));
    if (valid.length === 0) return null;
    return computeCompositeMacros(valid);
  }, [rows]);

  const onSubmit = () => {
    const components = rows
      .filter((row) => row.food && Number(row.grams) > 0)
      .map((row) => ({
        name: row.food!.name,
        grams: Number(row.grams),
        caloriesPer100g: row.food!.caloriesPer100g ?? undefined,
        proteinPer100g: row.food!.proteinPer100g ?? undefined,
        carbsPer100g: row.food!.carbsPer100g ?? undefined,
        fatPer100g: row.food!.fatPer100g ?? undefined,
      }));

    if (!name.trim() || components.length < 2) {
      toast.error("Укажи название и минимум два компонента с граммами");
      return;
    }

    startTransition(async () => {
      try {
        await createCustomFood({ name: name.trim(), components });
        toast.success("Продукт сохранён");
        setName("");
        setRows([emptyRow(), emptyRow()]);
        onSaved();
      } catch (err) {
        toast.error(getActionErrorMessage(err, "Не удалось сохранить продукт"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Собрать свой продукт</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Название</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Кофе с молоком (мой рецепт)"
          />
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Компонент</Label>
                <FoodSearchCombobox onSelect={(food) => updateRow(index, { food })} />
                {row.food && (
                  <span className="text-xs text-muted-foreground">Выбрано: {row.food.name}</span>
                )}
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
                disabled={rows.length === 2}
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
            <Plus className="h-3.5 w-3.5" /> Компонент
          </Button>
        </div>

        {preview && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Итого на 100 г: {preview.per100g.caloriesPer100g ?? 0} ккал · Б{" "}
            {preview.per100g.proteinPer100g ?? 0} · У {preview.per100g.carbsPer100g ?? 0} · Ж{" "}
            {preview.per100g.fatPer100g ?? 0}
          </div>
        )}

        <Button type="button" disabled={isPending} onClick={onSubmit}>
          {isPending ? "Сохранение..." : "Сохранить продукт"}
        </Button>
      </CardContent>
    </Card>
  );
}
