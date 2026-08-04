"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteWorkoutLog } from "@/lib/actions/workouts";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export interface WorkoutLogItem {
  id: string;
  date: Date | string;
  durationMinutes: number | null;
  notes: string | null;
  exerciseLogs: { id: string; name: string; sets: number | null; repsPerSet: number | null; weightKg: number | null }[];
}

export function WorkoutLogList({ logs, onChanged }: { logs: WorkoutLogItem[]; onChanged: () => void }) {
  const [isPending, startTransition] = useTransition();

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteWorkoutLog(id);
        onChanged();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось удалить тренировку");
      }
    });
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Тренировок пока нет
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="flex items-start justify-between gap-3 py-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                {dateFormatter.format(new Date(log.date))}
                {log.durationMinutes ? ` · ${log.durationMinutes} мин` : ""}
              </span>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {log.exerciseLogs.map((ex) => (
                  <span key={ex.id}>
                    {ex.name}
                    {ex.sets && ex.repsPerSet ? ` — ${ex.sets}×${ex.repsPerSet}` : ""}
                    {ex.weightKg ? ` @ ${ex.weightKg}кг` : ""}
                  </span>
                ))}
              </div>
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
