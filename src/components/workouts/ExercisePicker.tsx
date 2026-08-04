"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { listExerciseLibrary } from "@/lib/actions/workouts";

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
}

export function ExercisePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const library = await listExerciseLibrary();
      setOptions(library);
    });
  }, []);

  const filtered = value.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(value.trim().toLowerCase()))
    : options;

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder="Упражнение"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-md">
          {filtered.slice(0, 20).map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={() => onChange(option.name)}
              className="flex w-full flex-col items-start border-b border-border px-3 py-1.5 text-left text-sm last:border-0 hover:bg-muted"
            >
              <span>{option.name}</span>
              <span className="text-xs text-muted-foreground">{option.muscleGroup}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
