"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getShoppingList, toggleShoppingListItem, type ShoppingListItemWithChecked } from "@/lib/actions/menu";

export function ShoppingListDialog({
  open,
  onOpenChange,
  year,
  month,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
}) {
  const [items, setItems] = useState<ShoppingListItemWithChecked[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const fetched = await getShoppingList(year, month);
      setItems(fetched);
    });
  }, [open, year, month]);

  function onToggle(itemKey: string, checked: boolean) {
    // Optimistic update - the checklist should feel instant while shopping.
    setItems((prev) => prev.map((item) => (item.itemKey === itemKey ? { ...item, checked } : item)));
    startTransition(async () => {
      try {
        await toggleShoppingListItem(year, month, { itemKey, checked });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось сохранить отметку");
        setItems((prev) => prev.map((item) => (item.itemKey === itemKey ? { ...item, checked: !checked } : item)));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Список покупок</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          {items.length === 0 && !isPending && (
            <p className="text-sm text-muted-foreground">
              Список пуст — сгенерируй меню на месяц, чтобы получить список покупок.
            </p>
          )}
          {items.map((item) => (
            <label
              key={item.itemKey}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={item.checked}
                onChange={(e) => onToggle(item.itemKey, e.target.checked)}
              />
              <span className={item.checked ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground">{Math.round(item.totalGrams)} г</span>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
