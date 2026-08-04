"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyMacroSummary } from "@/components/nutrition/DailyMacroSummary";
import { FoodLogForm } from "@/components/nutrition/FoodLogForm";
import { FoodLogList, type FoodLogItem } from "@/components/nutrition/FoodLogList";
import { listFoodLogs, getDailyMacroSummary } from "@/lib/actions/nutrition";
import type { MacroSummary } from "@/lib/macro-summary-calc";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export function FoodLogSection() {
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [summary, setSummary] = useState<MacroSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const [fetchedLogs, fetchedSummary] = await Promise.all([
        listFoodLogs(date),
        getDailyMacroSummary(date),
      ]);
      setLogs(fetchedLogs);
      setSummary(fetchedSummary);
    });
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => setDate((d) => addDays(d, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-32 text-center text-sm font-medium">
          {dateFormatter.format(date)}
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => setDate((d) => addDays(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isPending && !summary ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        summary && <DailyMacroSummary summary={summary} />
      )}

      <FoodLogForm date={date} onAdded={reload} />

      {isPending && logs.length === 0 ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <FoodLogList logs={logs} onChanged={reload} />
      )}
    </div>
  );
}
