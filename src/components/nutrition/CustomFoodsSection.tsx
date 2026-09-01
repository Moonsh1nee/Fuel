"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomFoodBuilder } from "@/components/nutrition/CustomFoodBuilder";
import { CustomFoodsList, type CustomFoodItem } from "@/components/nutrition/CustomFoodsList";
import { listCustomFoods } from "@/lib/actions/custom-foods";

export function CustomFoodsSection() {
  const [foods, setFoods] = useState<CustomFoodItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listCustomFoods();
      setFoods(fetched);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-4">
      <CustomFoodBuilder onSaved={reload} />
      {isPending && foods.length === 0 ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <CustomFoodsList foods={foods} onChanged={reload} />
      )}
    </div>
  );
}
