"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMacroSummary } from "@/lib/macro-summary-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

// --- Nutrition plans ---

const nutritionPlanSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  targetCalories: z.number().int().min(0).optional(),
  targetProtein: z.number().min(0).optional(),
  targetCarbs: z.number().min(0).optional(),
  targetFat: z.number().min(0).optional(),
});

export async function listNutritionPlans() {
  const userId = await requireUserId();
  return prisma.nutritionPlan.findMany({
    where: { userId },
    include: { meals: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNutritionPlan(input: unknown) {
  const userId = await requireUserId();
  const data = nutritionPlanSchema.parse(input);
  const plan = await prisma.nutritionPlan.create({ data: { ...data, userId } });
  revalidatePath("/nutrition");
  return plan;
}

export async function updateNutritionPlan(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = nutritionPlanSchema.partial().parse(input);
  await prisma.nutritionPlan.updateMany({ where: { id, userId }, data });
  revalidatePath("/nutrition");
}

export async function deleteNutritionPlan(id: string) {
  const userId = await requireUserId();
  await prisma.nutritionPlan.deleteMany({ where: { id, userId } });
  revalidatePath("/nutrition");
}

const mealTemplateSchema = z.object({
  mealType: mealTypeSchema,
  name: z.string().min(1).max(150),
  calories: z.number().int().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
});

export async function createMealTemplate(planId: string, input: unknown) {
  const userId = await requireUserId();
  const plan = await prisma.nutritionPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plan not found");

  const data = mealTemplateSchema.parse(input);
  const meal = await prisma.mealTemplate.create({ data: { ...data, planId } });
  revalidatePath("/nutrition");
  return meal;
}

export async function deleteMealTemplate(id: string) {
  const userId = await requireUserId();
  const meal = await prisma.mealTemplate.findFirst({
    where: { id },
    include: { plan: true },
  });
  if (!meal || meal.plan.userId !== userId) throw new Error("Not found");
  await prisma.mealTemplate.delete({ where: { id } });
  revalidatePath("/nutrition");
}

// --- Food log ---

const foodLogSchema = z.object({
  date: z.coerce.date(),
  mealType: mealTypeSchema,
  name: z.string().min(1).max(200),
  calories: z.number().int().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export async function listFoodLogs(date: Date) {
  const userId = await requireUserId();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.foodLog.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createFoodLog(input: unknown) {
  const userId = await requireUserId();
  const data = foodLogSchema.parse(input);
  const log = await prisma.foodLog.create({ data: { ...data, userId } });
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return log;
}

export async function deleteFoodLog(id: string) {
  const userId = await requireUserId();
  await prisma.foodLog.deleteMany({ where: { id, userId } });
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
}

export async function getDailyMacroSummary(date: Date) {
  const logs = await listFoodLogs(date);
  return computeMacroSummary(logs);
}
