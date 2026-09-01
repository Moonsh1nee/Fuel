"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteCustomFood } from "@/lib/actions/custom-foods";

export interface CustomFoodItem {
  id: string;
  name: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  components: { id: string; name: string; grams: number }[];
}

export function CustomFoodsList({
  foods,
  onChanged,
}: {
  foods: CustomFoodItem[];
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCustomFood(id);
        onChanged();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить продукт");
      }
    });
  };

  if (foods.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Своих продуктов пока нет
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {foods.map((food) => (
        <Card key={food.id}>
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{food.name}</span>
              <span className="text-xs text-muted-foreground">
                {food.components.map((c) => `${c.name} (${c.grams} г)`).join(" + ")}
              </span>
              <span className="text-xs text-muted-foreground">
                на 100г: {food.caloriesPer100g ?? 0} ккал · Б {food.proteinPer100g ?? 0} · У{" "}
                {food.carbsPer100g ?? 0} · Ж {food.fatPer100g ?? 0}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() => onDelete(food.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
