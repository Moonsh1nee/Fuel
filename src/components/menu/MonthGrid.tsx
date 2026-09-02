"use client";

import { useMemo } from "react";
import { getMonthGridDays } from "@/lib/calendar-grid-calc";
import { DayCell } from "@/components/menu/DayCell";

export interface MenuEntryItem {
  id: string;
  date: Date;
  mealType: string;
  servings: number;
  recipe: {
    id: string;
    name: string;
    servings: number;
    caloriesPerServing: number | null;
    proteinPerServing: number | null;
    carbsPerServing: number | null;
    fatPerServing: number | null;
  };
}

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function MonthGrid({
  year,
  month,
  entries,
  onDayClick,
}: {
  year: number;
  month: number;
  entries: MenuEntryItem[];
  onDayClick: (date: Date) => void;
}) {
  const days = useMemo(() => getMonthGridDays(year, month, 1), [year, month]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, MenuEntryItem[]>();
    for (const entry of entries) {
      const key = dateKey(new Date(entry.date));
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const todayKey = dateKey(new Date());

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="text-center text-xs font-medium text-muted-foreground">
          {label}
        </div>
      ))}
      {days.map(({ date, isCurrentMonth }) => {
        const key = dateKey(date);
        return (
          <DayCell
            key={key}
            date={date}
            isCurrentMonth={isCurrentMonth}
            isToday={key === todayKey}
            entries={entriesByDay.get(key) ?? []}
            onClick={() => onDayClick(date)}
          />
        );
      })}
    </div>
  );
}
