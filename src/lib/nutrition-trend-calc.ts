import { computeMacroSummary, type MacroEntry } from "@/lib/macro-summary-calc";

export interface DailyMacroPoint {
  dateLabel: string; // "YYYY-MM-DD", local calendar day
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Buckets entries into one point per calendar day, `days` days starting at
 * `start` - a day with no entries still gets a zeroed point (same
 * "always the full range" convention as getMonthGridDays), so a trend chart
 * has a stable, evenly-spaced X axis instead of skipping empty days.
 */
export function buildDailyMacroTrend(
  entries: (MacroEntry & { date: Date })[],
  start: Date,
  days: number,
): DailyMacroPoint[] {
  const byDay = new Map<string, MacroEntry[]>();
  for (const entry of entries) {
    const key = localDateKey(entry.date);
    const list = byDay.get(key) ?? [];
    list.push(entry);
    byDay.set(key, list);
  }

  const points: DailyMacroPoint[] = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const key = localDateKey(day);
    const summary = computeMacroSummary(byDay.get(key) ?? []);
    points.push({
      dateLabel: key,
      calories: summary.totalCalories,
      protein: summary.totalProtein,
      carbs: summary.totalCarbs,
      fat: summary.totalFat,
    });
  }
  return points;
}
