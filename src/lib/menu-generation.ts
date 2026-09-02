// Local string-union type, not imported from @prisma/client, matching the
// rest of this codebase's calc-module convention of staying decoupled from
// Prisma - Prisma's generated MealType enum is structurally compatible.
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface RecipeCandidate {
  id: string;
  caloriesPerServing: number | null;
  proteinPerServing: number | null;
  carbsPerServing: number | null;
  fatPerServing: number | null;
}

export interface MacroTargets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface BuildMonthMenuInput {
  daysInMonth: number;
  mealSlots: MealType[];
  recipesBySlot: Partial<Record<MealType, RecipeCandidate[]>>;
  targets: MacroTargets | null;
  cooldownDays: number;
  rng: () => number;
}

export interface GeneratedMenuEntry {
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
  servings: number;
}

/**
 * Structured, not a formatted string - keeps this module free of
 * display-language concerns and lets the UI compose whatever Russian
 * message it wants (and lets tests assert on `reason`/`poolSize` instead of
 * fragile string matching).
 */
export interface MenuGenerationWarning {
  mealType: MealType;
  reason: "empty_pool" | "small_pool" | "single_recipe";
  poolSize: number;
}

export interface BuildMonthMenuResult {
  entries: GeneratedMenuEntry[];
  warnings: MenuGenerationWarning[];
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToQuarter(value: number): number {
  return Math.round(value * 4) / 4;
}

interface SlotSchedule {
  recipeIds: string[]; // one per day, length === daysInMonth
  warning: MenuGenerationWarning | null;
}

/**
 * Schedules one meal slot across the whole month: shuffles the pool,
 * reshuffling (bounded, not unbounded) whenever it's exhausted, while
 * excluding the last `cooldownDays` picks from being repeated. A pool too
 * small for the requested cooldown relaxes it automatically instead of
 * retrying forever - detected up front, never discovered via looping.
 */
function scheduleSlot(
  mealType: MealType,
  pool: RecipeCandidate[],
  daysInMonth: number,
  cooldownDays: number,
  rng: () => number,
): SlotSchedule {
  const poolSize = pool.length;

  let warning: MenuGenerationWarning | null = null;
  let effectiveCooldown = cooldownDays;
  if (poolSize === 1) {
    warning = { mealType, reason: "single_recipe", poolSize };
    effectiveCooldown = 0;
  } else if (poolSize <= cooldownDays) {
    warning = { mealType, reason: "small_pool", poolSize };
    effectiveCooldown = Math.max(poolSize - 1, 0);
  }

  const poolIds = pool.map((r) => r.id);
  const recipeIds: string[] = [];
  const recentHistory: string[] = [];
  let queue: string[] = [];

  for (let day = 0; day < daysInMonth; day++) {
    if (queue.length === 0) {
      queue = shuffle(poolIds, rng);
    }
    let pickedIndex = queue.findIndex((id) => !recentHistory.includes(id));
    if (pickedIndex === -1) pickedIndex = 0; // guarded by effectiveCooldown above, but never loop/throw
    const picked = queue.splice(pickedIndex, 1)[0];

    recipeIds.push(picked);
    recentHistory.push(picked);
    if (recentHistory.length > effectiveCooldown) recentHistory.shift();
  }

  return { recipeIds, warning };
}

export function buildMonthMenu(input: BuildMonthMenuInput): BuildMonthMenuResult {
  const warnings: MenuGenerationWarning[] = [];
  const scheduleBySlot = new Map<MealType, string[]>();
  const recipeById = new Map<string, RecipeCandidate>();

  for (const mealType of input.mealSlots) {
    const pool = input.recipesBySlot[mealType] ?? [];
    for (const recipe of pool) recipeById.set(recipe.id, recipe);

    if (pool.length === 0) {
      warnings.push({ mealType, reason: "empty_pool", poolSize: 0 });
      continue;
    }

    const { recipeIds, warning } = scheduleSlot(
      mealType,
      pool,
      input.daysInMonth,
      input.cooldownDays,
      input.rng,
    );
    scheduleBySlot.set(mealType, recipeIds);
    if (warning) warnings.push(warning);
  }

  const entries: GeneratedMenuEntry[] = [];

  for (let day = 0; day < input.daysInMonth; day++) {
    const dayPicks: { mealType: MealType; recipeId: string }[] = [];
    for (const mealType of input.mealSlots) {
      const schedule = scheduleBySlot.get(mealType);
      if (!schedule) continue; // empty-pool slot, skipped for every day
      dayPicks.push({ mealType, recipeId: schedule[day] });
    }

    let ratio = 1;
    if (input.targets?.calories) {
      const daySumCalories = dayPicks.reduce(
        (sum, pick) => sum + (recipeById.get(pick.recipeId)?.caloriesPerServing ?? 0),
        0,
      );
      if (daySumCalories > 0) {
        ratio = clamp(input.targets.calories / daySumCalories, 0.75, 1.5);
      }
    }

    const servings = input.targets?.calories ? roundToQuarter(ratio) : 1;
    for (const pick of dayPicks) {
      entries.push({ dayIndex: day, mealType: pick.mealType, recipeId: pick.recipeId, servings });
    }
  }

  return { entries, warnings };
}
