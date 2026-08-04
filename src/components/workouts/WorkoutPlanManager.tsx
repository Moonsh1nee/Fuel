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
import { ExercisePicker } from "@/components/workouts/ExercisePicker";
import {
  createWorkoutPlan,
  deleteWorkoutPlan,
  createPlanExercise,
  deletePlanExercise,
} from "@/lib/actions/workouts";

interface PlanExerciseItem {
  id: string;
  name: string;
  sets: number | null;
  repsPerSet: number | null;
  weightKg: number | null;
}

export interface WorkoutPlanItem {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number | null;
  exercises: PlanExerciseItem[];
}

function NewPlanDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createWorkoutPlan({
          name: name.trim(),
          daysPerWeek: daysPerWeek ? Number(daysPerWeek) : undefined,
        });
        toast.success("План создан");
        setName("");
        setDaysPerWeek("");
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
          <DialogTitle>Новый план тренировок</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Дней в неделю</Label>
            <Input
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
            />
          </div>
          <Button type="button" disabled={isPending || !name.trim()} onClick={onSubmit}>
            {isPending ? "Создание..." : "Создать"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddExerciseDialog({ planId, onAdded }: { planId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [repsPerSet, setRepsPerSet] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      try {
        await createPlanExercise(planId, {
          name: name.trim(),
          sets: sets ? Number(sets) : undefined,
          repsPerSet: repsPerSet ? Number(repsPerSet) : undefined,
          weightKg: weightKg ? Number(weightKg) : undefined,
        });
        setName("");
        setSets("");
        setRepsPerSet("");
        setWeightKg("");
        setOpen(false);
        onAdded();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось добавить упражнение");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Plus className="h-3.5 w-3.5" /> Упражнение
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить упражнение в план</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Упражнение</Label>
            <ExercisePicker value={name} onChange={setName} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Сеты</Label>
              <Input type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Повт.</Label>
              <Input
                type="number"
                value={repsPerSet}
                onChange={(e) => setRepsPerSet(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Вес, кг</Label>
              <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </div>
          </div>
          <Button type="button" disabled={isPending || !name.trim()} onClick={onSubmit}>
            {isPending ? "Добавление..." : "Добавить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WorkoutPlanManager({
  plans,
  onChanged,
}: {
  plans: WorkoutPlanItem[];
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const onDeletePlan = (id: string) => {
    startTransition(async () => {
      await deleteWorkoutPlan(id);
      onChanged();
    });
  };

  const onDeleteExercise = (id: string) => {
    startTransition(async () => {
      await deletePlanExercise(id);
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
            Планов тренировок пока нет
          </CardContent>
        </Card>
      )}

      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{plan.name}</CardTitle>
              {plan.daysPerWeek && (
                <p className="text-xs text-muted-foreground">{plan.daysPerWeek} дней в неделю</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <AddExerciseDialog planId={plan.id} onAdded={onChanged} />
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
            {plan.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">Упражнений ещё нет</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {plan.exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>{exercise.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {exercise.sets && exercise.repsPerSet && (
                        <span>
                          {exercise.sets}×{exercise.repsPerSet}
                          {exercise.weightKg ? ` @ ${exercise.weightKg}кг` : ""}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onDeleteExercise(exercise.id)}
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
