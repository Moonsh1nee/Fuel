"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCompositeMacros } from "@/lib/composite-food-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const customFoodComponentSchema = z.object({
  name: z.string().min(1).max(200),
  grams: z.number().positive(),
  caloriesPer100g: z.number().min(0).optional(),
  proteinPer100g: z.number().min(0).optional(),
  carbsPer100g: z.number().min(0).optional(),
  fatPer100g: z.number().min(0).optional(),
});

const customFoodSchema = z.object({
  name: z.string().min(1).max(150),
  components: z.array(customFoodComponentSchema).min(2),
});

export async function listCustomFoods() {
  const userId = await requireUserId();
  return prisma.customFood.findMany({
    where: { userId },
    include: { components: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCustomFood(input: unknown) {
  const userId = await requireUserId();
  const { name, components } = customFoodSchema.parse(input);

  const totals = computeCompositeMacros(
    components.map((c) => ({
      grams: c.grams,
      per100g: {
        caloriesPer100g: c.caloriesPer100g ?? null,
        proteinPer100g: c.proteinPer100g ?? null,
        carbsPer100g: c.carbsPer100g ?? null,
        fatPer100g: c.fatPer100g ?? null,
      },
    })),
  );

  const food = await prisma.customFood.create({
    data: {
      userId,
      name,
      caloriesPer100g: totals.per100g.caloriesPer100g,
      proteinPer100g: totals.per100g.proteinPer100g,
      carbsPer100g: totals.per100g.carbsPer100g,
      fatPer100g: totals.per100g.fatPer100g,
      components: { create: components },
    },
    include: { components: true },
  });

  revalidatePath("/nutrition");
  return food;
}

export async function deleteCustomFood(id: string) {
  const userId = await requireUserId();
  await prisma.customFood.deleteMany({ where: { id, userId } });
  revalidatePath("/nutrition");
}
