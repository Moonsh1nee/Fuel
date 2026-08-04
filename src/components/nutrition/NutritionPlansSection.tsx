"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NutritionPlanManager, type NutritionPlanItem } from "@/components/nutrition/NutritionPlanManager";
import { listNutritionPlans } from "@/lib/actions/nutrition";

export function NutritionPlansSection() {
  const [plans, setPlans] = useState<NutritionPlanItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listNutritionPlans();
      setPlans(fetched);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!loaded) return <Skeleton className="h-40 w-full" />;

  return <NutritionPlanManager plans={plans} onChanged={reload} />;
}
