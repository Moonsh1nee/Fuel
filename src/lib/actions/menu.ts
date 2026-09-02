"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMonthMenu, type MealType as GenMealType, type RecipeCandidate } from "@/lib/menu-generation";
import { mulberry32 } from "@/lib/seeded-rng";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const DEFAULT_MEAL_SLOTS: GenMealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
const DEFAULT_COOLDOWN_DAYS = 3;

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1); // first day of next month, exclusive upper bound
  return { start, end };
}

export async function listMenuEntries(year: number, month: number) {
  const userId = await requireUserId();
  const { start, end } = monthRange(year, month);
  return prisma.menuEntry.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { recipe: true },
    orderBy: { date: "asc" },
  });
}

const generateOptionsSchema = z.object({
  planId: z.string().optional(),
  mealSlots: z.array(z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"])).optional(),
});

export interface GenerateMonthMenuResult {
  entriesCreated: number;
  warnings: { mealType: GenMealType; reason: string; poolSize: number }[];
}

export async function generateMonthMenu(
  year: number,
  month: number,
  options?: unknown,
): Promise<GenerateMonthMenuResult> {
  const userId = await requireUserId();
  const { planId, mealSlots } = generateOptionsSchema.parse(options ?? {});
  const slots = mealSlots ?? DEFAULT_MEAL_SLOTS;

  let targets: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null } | null =
    null;
  if (planId) {
    const plan = await prisma.nutritionPlan.findFirst({ where: { id: planId, userId } });
    if (plan) {
      targets = {
        calories: plan.targetCalories,
        protein: plan.targetProtein,
        carbs: plan.targetCarbs,
        fat: plan.targetFat,
      };
    }
  }

  const recipes = await prisma.recipe.findMany({ where: { userId, mealType: { in: slots } } });

  const recipesBySlot: Partial<Record<GenMealType, RecipeCandidate[]>> = {};
  for (const slot of slots) {
    recipesBySlot[slot] = recipes
      .filter((r) => r.mealType === slot)
      .map((r) => ({
        id: r.id,
        caloriesPerServing: r.caloriesPerServing,
        proteinPerServing: r.proteinPerServing,
        carbsPerServing: r.carbsPerServing,
        fatPerServing: r.fatPerServing,
      }));
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const result = buildMonthMenu({
    daysInMonth,
    mealSlots: slots,
    recipesBySlot,
    targets,
    cooldownDays: DEFAULT_COOLDOWN_DAYS,
    rng: mulberry32(Date.now()),
  });

  const { start, end } = monthRange(year, month);

  await prisma.$transaction(async (tx) => {
    await tx.menuEntry.deleteMany({ where: { userId, date: { gte: start, lt: end } } });
    if (result.entries.length > 0) {
      await tx.menuEntry.createMany({
        data: result.entries.map((e) => ({
          userId,
          date: new Date(year, month - 1, 1 + e.dayIndex),
          mealType: e.mealType,
          recipeId: e.recipeId,
          servings: e.servings,
        })),
      });
    }
  });

  revalidatePath("/menu");
  return { entriesCreated: result.entries.length, warnings: result.warnings };
}

export async function clearMonthMenu(year: number, month: number) {
  const userId = await requireUserId();
  const { start, end } = monthRange(year, month);
  await prisma.menuEntry.deleteMany({ where: { userId, date: { gte: start, lt: end } } });
  revalidatePath("/menu");
}

export async function deleteMenuEntry(id: string) {
  const userId = await requireUserId();
  await prisma.menuEntry.deleteMany({ where: { id, userId } });
  revalidatePath("/menu");
}
