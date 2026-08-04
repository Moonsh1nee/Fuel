"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listExerciseLibrary, createExerciseTemplate } from "@/lib/actions/workouts";

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  isSystem: boolean;
}

function AddExerciseDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!name.trim() || !muscleGroup.trim() || !equipment.trim()) return;
    startTransition(async () => {
      try {
        await createExerciseTemplate({
          name: name.trim(),
          muscleGroup: muscleGroup.trim(),
          equipment: equipment.trim(),
        });
        setName("");
        setMuscleGroup("");
        setEquipment("");
        setOpen(false);
        onCreated();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось добавить упражнение");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Plus className="h-4 w-4" /> Своё упражнение
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить упражнение</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Группа мышц</Label>
            <Input value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Инвентарь</Label>
            <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          </div>
          <Button
            type="button"
            disabled={isPending || !name.trim() || !muscleGroup.trim() || !equipment.trim()}
            onClick={onSubmit}
          >
            {isPending ? "Добавление..." : "Добавить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ExerciseLibraryBrowser() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listExerciseLibrary();
      setExercises(fetched);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddExerciseDialog onCreated={reload} />
      </div>

      {!loaded ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Библиотека упражнений</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span>{exercise.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {exercise.muscleGroup} · {exercise.equipment}
                  </span>
                </div>
                {!exercise.isSystem && <Badge variant="outline">Своё</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
