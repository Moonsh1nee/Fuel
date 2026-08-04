"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExercisePicker } from "@/components/workouts/ExercisePicker";
import { createWorkoutLog } from "@/lib/actions/workouts";

interface ExerciseSetRow {
  name: string;
  sets: string;
  repsPerSet: string;
  weightKg: string;
}

const emptyRow = (): ExerciseSetRow => ({ name: "", sets: "", repsPerSet: "", weightKg: "" });

export function WorkoutLogForm({ date, onAdded }: { date: Date; onAdded: () => void }) {
  const [durationMinutes, setDurationMinutes] = useState("");
  const [rows, setRows] = useState<ExerciseSetRow[]>([emptyRow()]);
  const [isPending, startTransition] = useTransition();

  const updateRow = (index: number, patch: Partial<ExerciseSetRow>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const onSubmit = () => {
    const exercises = rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        sets: row.sets ? Number(row.sets) : undefined,
        repsPerSet: row.repsPerSet ? Number(row.repsPerSet) : undefined,
        weightKg: row.weightKg ? Number(row.weightKg) : undefined,
      }));
    if (exercises.length === 0) return;

    startTransition(async () => {
      try {
        await createWorkoutLog({
          date,
          durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
          exercises,
        });
        toast.success("Тренировка добавлена");
        setDurationMinutes("");
        setRows([emptyRow()]);
        onAdded();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось добавить тренировку");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавить тренировку</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label>Длительность, мин</Label>
          <Input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_repeat(3,4.5rem)_auto] items-end gap-2">
              <ExercisePicker value={row.name} onChange={(name) => updateRow(index, { name })} />
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Сеты</Label>
                <Input
                  type="number"
                  value={row.sets}
                  onChange={(e) => updateRow(index, { sets: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Повт.</Label>
                <Input
                  type="number"
                  value={row.repsPerSet}
                  onChange={(e) => updateRow(index, { repsPerSet: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Вес, кг</Label>
                <Input
                  type="number"
                  value={row.weightKg}
                  onChange={(e) => updateRow(index, { weightKg: e.target.value })}
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
            <Plus className="h-3.5 w-3.5" /> Упражнение
          </Button>
        </div>

        <Button type="button" disabled={isPending} onClick={onSubmit}>
          {isPending ? "Сохранение..." : "Сохранить тренировку"}
        </Button>
      </CardContent>
    </Card>
  );
}
