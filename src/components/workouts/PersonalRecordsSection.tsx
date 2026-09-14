"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonalRecordForm } from "@/components/workouts/PersonalRecordForm";
import { PersonalRecordsList, type PersonalRecordItem } from "@/components/workouts/PersonalRecordsList";
import { PersonalRecordChart } from "@/components/workouts/PersonalRecordChart";
import { listPersonalRecords } from "@/lib/actions/workouts";

export function PersonalRecordsSection() {
  const [records, setRecords] = useState<PersonalRecordItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listPersonalRecords();
      setRecords(fetched);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      <PersonalRecordForm onAdded={reload} />
      {loaded && <PersonalRecordChart records={records} />}
      {!loaded ? <Skeleton className="h-32 w-full" /> : <PersonalRecordsList records={records} />}
    </div>
  );
}
