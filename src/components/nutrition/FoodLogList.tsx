"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteFoodLog } from "@/lib/actions/nutrition";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

export interface FoodLogItem {
  id: string;
  mealType: string;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export function FoodLogList({ logs, onChanged }: { logs: FoodLogItem[]; onChanged: () => void }) {
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteFoodLog(id);
        onChanged();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить запись");
      }
    });
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Записей за этот день ещё нет
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                {MEAL_LABELS[log.mealType] ?? log.mealType}
              </span>
              <span className="font-medium">{log.name}</span>
              <span className="text-xs text-muted-foreground">
                {log.calories ?? 0} ккал · Б {log.protein ?? 0} · У {log.carbs ?? 0} · Ж{" "}
                {log.fat ?? 0}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isPending}
              onClick={() => onDelete(log.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
