"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthGrid, type MenuEntryItem } from "@/components/menu/MonthGrid";
import { DayDetailDialog } from "@/components/menu/DayDetailDialog";
import { GenerateMonthDialog } from "@/components/menu/GenerateMonthDialog";
import { ShoppingListDialog } from "@/components/menu/ShoppingListDialog";
import { listMenuEntries } from "@/lib/actions/menu";

const MONTH_LABELS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function MenuSection() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [entries, setEntries] = useState<MenuEntryItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(() => {
    startTransition(async () => {
      const fetched = await listMenuEntries(year, month);
      setEntries(fetched);
    });
  }, [year, month]);

  useEffect(() => {
    reload();
  }, [reload]);

  function prevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const selectedDayEntries = selectedDay
    ? entries.filter((e) => dateKey(new Date(e.date)) === dateKey(selectedDay))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-40 text-center text-sm font-medium">
            {MONTH_LABELS[month - 1]} {year}
          </span>
          <Button type="button" variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShoppingListOpen(true)}>
            <ShoppingCart className="h-4 w-4" /> Список покупок
          </Button>
          <Button type="button" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="h-4 w-4" /> Сгенерировать месяц
          </Button>
        </div>
      </div>

      {isPending && entries.length === 0 ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <MonthGrid year={year} month={month} entries={entries} onDayClick={setSelectedDay} />
      )}

      <DayDetailDialog
        date={selectedDay}
        entries={selectedDayEntries}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        onChanged={reload}
      />

      <GenerateMonthDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        year={year}
        month={month}
        onGenerated={reload}
      />

      <ShoppingListDialog open={shoppingListOpen} onOpenChange={setShoppingListOpen} year={year} month={month} />
    </div>
  );
}
