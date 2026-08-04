export interface MacroEntry {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface MacroSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entriesCount: number;
}

export function computeMacroSummary(entries: MacroEntry[]): MacroSummary {
  return entries.reduce<MacroSummary>(
    (summary, entry) => ({
      totalCalories: summary.totalCalories + (entry.calories ?? 0),
      totalProtein: summary.totalProtein + (entry.protein ?? 0),
      totalCarbs: summary.totalCarbs + (entry.carbs ?? 0),
      totalFat: summary.totalFat + (entry.fat ?? 0),
      entriesCount: summary.entriesCount + 1,
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, entriesCount: 0 },
  );
}
