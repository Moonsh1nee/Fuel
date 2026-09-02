"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeRecipeMacrosPerServing } from "@/lib/recipe-macro-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);

const recipeIngredientSchema = z.object({
  name: z.string().min(1).max(200),
  grams: z.number().positive(),
  caloriesPer100g: z.number().min(0).optional(),
  proteinPer100g: z.number().min(0).optional(),
  carbsPer100g: z.number().min(0).optional(),
  fatPer100g: z.number().min(0).optional(),
});

const recipeSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  mealType: mealTypeSchema,
  servings: z.number().int().min(1),
  instructions: z.string().min(1).max(4000),
  prepMinutes: z.number().int().min(0).optional(),
  cookMinutes: z.number().int().min(0).optional(),
  // A single-ingredient recipe (e.g. "2 boiled eggs") is legitimate, unlike
  // a 1-component CustomFood which wouldn't really be a "combo" - min 1, not 2.
  ingredients: z.array(recipeIngredientSchema).min(1),
});

function toPer100gInputs(ingredients: z.infer<typeof recipeIngredientSchema>[]) {
  return ingredients.map((i) => ({
    grams: i.grams,
    per100g: {
      caloriesPer100g: i.caloriesPer100g ?? null,
      proteinPer100g: i.proteinPer100g ?? null,
      carbsPer100g: i.carbsPer100g ?? null,
      fatPer100g: i.fatPer100g ?? null,
    },
  }));
}

export async function listRecipes(mealType?: z.infer<typeof mealTypeSchema>) {
  const userId = await requireUserId();
  return prisma.recipe.findMany({
    where: { userId, ...(mealType ? { mealType } : {}) },
    include: { ingredients: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRecipe(input: unknown) {
  const userId = await requireUserId();
  const { ingredients, ...data } = recipeSchema.parse(input);

  const perServing = computeRecipeMacrosPerServing(toPer100gInputs(ingredients), data.servings);

  const recipe = await prisma.recipe.create({
    data: {
      ...data,
      userId,
      caloriesPerServing: perServing.calories,
      proteinPerServing: perServing.protein,
      carbsPerServing: perServing.carbs,
      fatPerServing: perServing.fat,
      ingredients: { create: ingredients },
    },
    include: { ingredients: true },
  });

  revalidatePath("/recipes");
  return recipe;
}

export async function updateRecipe(id: string, input: unknown) {
  const userId = await requireUserId();
  const existing = await prisma.recipe.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Recipe not found");

  const { ingredients, ...data } = recipeSchema.parse(input);
  const perServing = computeRecipeMacrosPerServing(toPer100gInputs(ingredients), data.servings);

  // Client submits the full current ingredient list, not a diff - replacing
  // all of them is simplest-correct here, same as re-creating from scratch.
  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    return tx.recipe.update({
      where: { id },
      data: {
        ...data,
        caloriesPerServing: perServing.calories,
        proteinPerServing: perServing.protein,
        carbsPerServing: perServing.carbs,
        fatPerServing: perServing.fat,
        ingredients: { create: ingredients },
      },
      include: { ingredients: true },
    });
  });

  revalidatePath("/recipes");
  revalidatePath("/menu");
  return recipe;
}

export async function deleteRecipe(id: string) {
  const userId = await requireUserId();
  await prisma.recipe.deleteMany({ where: { id, userId } });
  revalidatePath("/recipes");
  revalidatePath("/menu");
}
