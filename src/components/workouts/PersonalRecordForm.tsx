"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ExercisePicker } from "@/components/workouts/ExercisePicker";
import { createPersonalRecord } from "@/lib/actions/workouts";

const RECORD_TYPE_LABELS: Record<string, string> = {
  max_weight: "Макс. вес",
  max_reps: "Макс. повторений",
  max_volume: "Макс. объём",
};

export function PersonalRecordForm({ onAdded }: { onAdded: () => void }) {
  const [exerciseName, setExerciseName] = useState("");
  const [recordType, setRecordType] = useState("max_weight");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!exerciseName.trim() || !value) return;
    startTransition(async () => {
      try {
        const { isNewRecord } = await createPersonalRecord({
          exerciseName: exerciseName.trim(),
          recordType,
          value: Number(value),
          unit,
          achievedAt: new Date(),
        });
        toast.success(isNewRecord ? "Новый личный рекорд!" : "Запись добавлена");
        setExerciseName("");
        setValue("");
        onAdded();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось добавить рекорд");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добавить рекорд</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>Упражнение</Label>
          <ExercisePicker value={exerciseName} onChange={setExerciseName} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Тип</Label>
          <Select value={recordType} onValueChange={setRecordType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RECORD_TYPE_LABELS).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Значение</Label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Единица</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="col-span-2 flex items-end sm:col-span-4">
          <Button
            type="button"
            disabled={isPending || !exerciseName.trim() || !value}
            onClick={onSubmit}
          >
            {isPending ? "Сохранение..." : "Сохранить рекорд"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
