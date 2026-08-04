"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutPlanManager, type WorkoutPlanItem } from "@/components/workouts/WorkoutPlanManager";
import { listWorkoutPlans } from "@/lib/actions/workouts";

export function WorkoutPlansSection() {
  const [plans, setPlans] = useState<WorkoutPlanItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listWorkoutPlans();
      setPlans(fetched);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!loaded) return <Skeleton className="h-40 w-full" />;

  return <WorkoutPlanManager plans={plans} onChanged={reload} />;
}
