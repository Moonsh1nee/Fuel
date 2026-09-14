"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { listNutritionPlans } from "@/lib/actions/nutrition";
import { generateMonthMenu } from "@/lib/actions/menu";
import { getActionErrorMessage } from "@/lib/action-error";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

const NO_PLAN = "none";

export function GenerateMonthDialog({
  open,
  onOpenChange,
  year,
  month,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  onGenerated: () => void;
}) {
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [planId, setPlanId] = useState(NO_PLAN);
  const [includeSnack, setIncludeSnack] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    listNutritionPlans().then((fetched) => setPlans(fetched.map((p) => ({ id: p.id, name: p.name }))));
  }, [open]);

  function onGenerate() {
    const confirmed = window.confirm(
      "Сгенерировать меню на этот месяц? Существующие записи меню за этот месяц будут заменены.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const mealSlots = includeSnack
          ? ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]
          : ["BREAKFAST", "LUNCH", "DINNER"];
        const result = await generateMonthMenu(year, month, {
          planId: planId !== NO_PLAN ? planId : undefined,
          mealSlots,
        });
        toast.success(`Меню сгенерировано: ${result.entriesCreated} записей`);
        for (const warning of result.warnings) {
          toast.warning(formatWarning(warning));
        }
        onOpenChange(false);
        onGenerated();
      } catch (err) {
        toast.error(getActionErrorMessage(err, "Не удалось сгенерировать меню"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сгенерировать меню на месяц</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Использовать цели плана</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PLAN}>Без плана</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={includeSnack}
              onChange={(e) => setIncludeSnack(e.target.checked)}
            />
            Включить перекусы
          </label>
          <Button type="button" disabled={isPending} onClick={onGenerate}>
            {isPending ? "Генерация..." : "Сгенерировать"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatWarning(warning: { mealType: string; reason: string; poolSize: number }): string {
  const label = MEAL_LABELS[warning.mealType] ?? warning.mealType;
  if (warning.reason === "empty_pool") {
    return `Нет рецептов для «${label}» — этот приём пищи не включён в меню.`;
  }
  if (warning.reason === "single_recipe") {
    return `Для «${label}» доступен только один рецепт — он используется каждый день.`;
  }
  if (warning.reason === "small_pool") {
    return `Для «${label}» доступно всего ${warning.poolSize} рецепт(а/ов) — повторы чаще, чем раз в несколько дней, неизбежны.`;
  }
  return `${label}: ${warning.reason}`;
}
