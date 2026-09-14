"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteMenuEntry } from "@/lib/actions/menu";
import { getActionErrorMessage } from "@/lib/action-error";
import type { MenuEntryItem } from "@/components/menu/MonthGrid";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

export function DayDetailDialog({
  date,
  entries,
  onOpenChange,
  onChanged,
}: {
  date: Date | null;
  entries: MenuEntryItem[];
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteMenuEntry(id);
        toast.success("Запись удалена");
        onChanged();
      } catch (err) {
        toast.error(getActionErrorMessage(err, "Не удалось удалить запись"));
      }
    });
  }

  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{date ? dateFormatter.format(date) : ""}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">На этот день ничего не запланировано</p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {MEAL_LABELS[entry.mealType] ?? entry.mealType}
                </span>
                <span className="font-medium">{entry.recipe.name}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.servings} порц. ·{" "}
                  {Math.round((entry.recipe.caloriesPerServing ?? 0) * entry.servings)} ккал
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => onDelete(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
