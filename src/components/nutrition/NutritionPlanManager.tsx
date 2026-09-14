"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  createNutritionPlan,
  deleteNutritionPlan,
  createMealTemplate,
  deleteMealTemplate,
  setActiveNutritionPlan,
} from "@/lib/actions/nutrition";

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

interface MealTemplateItem {
  id: string;
  mealType: string;
  name: string;
  calories: number | null;
}

export interface NutritionPlanItem {
  id: string;
  name: string;
  description: string | null;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  isActive: boolean;
  meals: MealTemplateItem[];
}

function NewPlanDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [targetCalories, setTargetCalories] = useState("");
  const [targetProtein, setTargetProtein] = useState("");
  const [targetCarbs, setTargetCarbs] = useState("");
  const [targetFat, setTargetFat] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createNutritionPlan({
          name: name.trim(),
          targetCalories: targetCalories ? Number(targetCalories) : undefined,
          targetProtein: targetProtein ? Number(targetProtein) : undefined,
          targetCarbs: targetCarbs ? Number(targetCarbs) : undefined,
          targetFat: targetFat ? Number(targetFat) : undefined,
        });
        toast.success("План создан");
        setName("");
        setTargetCalories("");
        setTargetProtein("");
        setTargetCarbs("");
        setTargetFat("");
        setOpen(false);
        onCreated();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось создать план");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Plus className="h-4 w-4" /> Новый план
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый план питания</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Целевые калории</Label>
            <Input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Белки, г</Label>
              <Input
                type="number"
                value={targetProtein}
                onChange={(e) => setTargetProtein(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Углеводы, г</Label>
              <Input
                type="number"
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Жиры, г</Label>
              <Input type="number" value={targetFat} onChange={(e) => setTargetFat(e.target.value)} />
            </div>
          </div>
          <Button type="button" disabled={isPending || !name.trim()} onClick={onSubmit}>
            {isPending ? "Создание..." : "Создать"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMealDialog({ planId, onAdded }: { planId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [mealType, setMealType] = useState("BREAKFAST");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createMealTemplate(planId, {
          mealType,
          name: name.trim(),
          calories: calories ? Number(calories) : undefined,
        });
        setName("");
        setCalories("");
        setOpen(false);
        onAdded();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось добавить приём пищи");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Plus className="h-3.5 w-3.5" /> Приём пищи
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить приём пищи в план</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Тип</Label>
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
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Калории</Label>
            <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </div>
          <Button type="button" disabled={isPending || !name.trim()} onClick={onSubmit}>
            {isPending ? "Добавление..." : "Добавить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NutritionPlanManager({
  plans,
  onChanged,
}: {
  plans: NutritionPlanItem[];
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const onDeletePlan = (id: string) => {
    startTransition(async () => {
      await deleteNutritionPlan(id);
      onChanged();
    });
  };

  const onDeleteMeal = (id: string) => {
    startTransition(async () => {
      await deleteMealTemplate(id);
      onChanged();
    });
  };

  const onSetActive = (id: string) => {
    startTransition(async () => {
      await setActiveNutritionPlan(id);
      onChanged();
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <NewPlanDialog onCreated={onChanged} />
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Планов питания пока нет
          </CardContent>
        </Card>
      )}

      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.isActive && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Активен
                  </span>
                )}
              </div>
              {(plan.targetCalories || plan.targetProtein || plan.targetCarbs || plan.targetFat) && (
                <p className="text-xs text-muted-foreground">
                  Цель:{plan.targetCalories ? ` ${plan.targetCalories} ккал` : ""}
                  {plan.targetProtein ? ` · Б ${plan.targetProtein}` : ""}
                  {plan.targetCarbs ? ` · У ${plan.targetCarbs}` : ""}
                  {plan.targetFat ? ` · Ж ${plan.targetFat}` : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!plan.isActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onSetActive(plan.id)}
                >
                  Сделать активным
                </Button>
              )}
              <AddMealDialog planId={plan.id} onAdded={onChanged} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => onDeletePlan(plan.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {plan.meals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Приёмов пищи ещё нет</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {plan.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="text-xs text-muted-foreground">
                        {MEAL_LABELS[meal.mealType] ?? meal.mealType}
                      </span>{" "}
                      {meal.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {meal.calories !== null && (
                        <span className="text-xs text-muted-foreground">
                          {meal.calories} ккал
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeleteMeal(meal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
