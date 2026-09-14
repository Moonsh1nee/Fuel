"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutLogForm } from "@/components/workouts/WorkoutLogForm";
import { WorkoutLogList, type WorkoutLogItem } from "@/components/workouts/WorkoutLogList";
import { VolumeTrendChart } from "@/components/workouts/VolumeTrendChart";
import { listWorkoutLogs } from "@/lib/actions/workouts";

export function WorkoutLogSection() {
  const [logs, setLogs] = useState<WorkoutLogItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listWorkoutLogs();
      setLogs(fetched);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      <WorkoutLogForm date={new Date()} onAdded={reload} />
      <VolumeTrendChart />
      {!loaded ? <Skeleton className="h-32 w-full" /> : <WorkoutLogList logs={logs} onChanged={reload} />}
    </div>
  );
}
