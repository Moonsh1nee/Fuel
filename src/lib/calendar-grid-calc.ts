export interface MonthGridDay {
  date: Date;
  isCurrentMonth: boolean;
}

/**
 * Returns a grid of days covering `month` (1-12) padded with the
 * surrounding month's trailing days so every row is a complete week -
 * exactly as many cells as needed (28/35/42), not a fixed count.
 */
export function getMonthGridDays(year: number, month: number, weekStartsOn: 0 | 1 = 1): MonthGridDay[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const firstWeekday = firstOfMonth.getDay();
  const leadingCount = (firstWeekday - weekStartsOn + 7) % 7;

  const days: MonthGridDay[] = [];

  for (let i = leadingCount; i > 0; i--) {
    days.push({ date: new Date(year, month - 1, 1 - i), isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month - 1, d), isCurrentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const lastDate = days[days.length - 1].date;
    const next = new Date(lastDate);
    next.setDate(next.getDate() + 1);
    days.push({ date: next, isCurrentMonth: false });
  }

  return days;
}
