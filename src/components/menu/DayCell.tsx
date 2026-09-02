"use client";

import { cn } from "@/lib/utils";
import type { MenuEntryItem } from "@/components/menu/MonthGrid";

const MEAL_SHORT: Record<string, string> = {
  BREAKFAST: "З",
  LUNCH: "О",
  DINNER: "У",
  SNACK: "П",
};

export function DayCell({
  date,
  isCurrentMonth,
  isToday,
  entries,
  onClick,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  entries: MenuEntryItem[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-24 flex-col gap-1 rounded-lg border border-border p-1.5 text-left text-xs transition-colors hover:bg-muted/50",
        !isCurrentMonth && "opacity-40",
        isToday && "border-primary",
      )}
    >
      <span className="font-medium">{date.getDate()}</span>
      <div className="flex flex-col gap-0.5">
        {entries.slice(0, 3).map((entry) => (
          <span key={entry.id} className="truncate rounded bg-muted px-1 py-0.5">
            {MEAL_SHORT[entry.mealType] ?? entry.mealType}: {entry.recipe.name}
          </span>
        ))}
        {entries.length > 3 && (
          <span className="text-muted-foreground">+{entries.length - 3}</span>
        )}
      </div>
    </button>
  );
}
