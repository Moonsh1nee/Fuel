import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import argon2 from "argon2";
import { computeRecipeMacrosPerServing } from "../src/lib/recipe-macro-calc";

function resolveSqlitePath(databaseUrl: string | undefined): string {
  if (!databaseUrl) return "./prisma/dev.db";
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

// Ported from habitforge-backend's system exercise library
// (alembic migration s5g6h7i8j9k0_add_exercise_library_and_personal_records.py).
const SYSTEM_EXERCISES: { name: string; muscleGroup: string; equipment: string }[] = [
  { name: "Жим лёжа", muscleGroup: "Грудь", equipment: "Штанга" },
  { name: "Приседания", muscleGroup: "Ноги", equipment: "Штанга" },
  { name: "Становая тяга", muscleGroup: "Спина", equipment: "Штанга" },
  { name: "Жим стоя", muscleGroup: "Плечи", equipment: "Штанга" },
  { name: "Подтягивания", muscleGroup: "Спина", equipment: "Турник" },
  { name: "Отжимания на брусьях", muscleGroup: "Грудь", equipment: "Брусья" },
  { name: "Тяга штанги в наклоне", muscleGroup: "Спина", equipment: "Штанга" },
  { name: "Жим гантелей лёжа", muscleGroup: "Грудь", equipment: "Гантели" },
  { name: "Выпады", muscleGroup: "Ноги", equipment: "Гантели" },
  { name: "Сгибания на бицепс", muscleGroup: "Руки", equipment: "Гантели" },
  { name: "Французский жим", muscleGroup: "Руки", equipment: "Штанга" },
  { name: "Разведение гантелей в стороны", muscleGroup: "Плечи", equipment: "Гантели" },
  { name: "Гиперэкстензия", muscleGroup: "Спина", equipment: "Без инвентаря" },
  { name: "Скручивания", muscleGroup: "Пресс", equipment: "Без инвентаря" },
  { name: "Планка", muscleGroup: "Пресс", equipment: "Без инвентаря" },
];

async function seedSystemExercises() {
  for (const exercise of SYSTEM_EXERCISES) {
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: exercise.name, isSystem: true },
    });
    if (existing) continue;
    await prisma.exerciseTemplate.create({
      data: { ...exercise, isSystem: true },
    });
  }
}

async function seedDemoUser() {
  const email = "demo@fuel.local";
  const passwordHash = await argon2.hash("demo12345");

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      passwordHash,
    },
  });

  const existingLogs = await prisma.foodLog.count({ where: { userId: user.id } });
  if (existingLogs === 0) {
    const today = new Date();
    await prisma.foodLog.createMany({
      data: [
        {
          userId: user.id,
          date: today,
          mealType: "BREAKFAST",
          name: "Овсянка с бананом",
          calories: 350,
          protein: 12,
          carbs: 60,
          fat: 6,
        },
        {
          userId: user.id,
          date: today,
          mealType: "LUNCH",
          name: "Куриная грудка с рисом",
          calories: 550,
          protein: 45,
          carbs: 55,
          fat: 10,
        },
      ],
    });
  }

  const existingWorkoutLogs = await prisma.workoutLog.count({ where: { userId: user.id } });
  if (existingWorkoutLogs === 0) {
    await prisma.workoutLog.create({
      data: {
        userId: user.id,
        date: new Date(),
        durationMinutes: 60,
        notes: "Верх тела",
        exerciseLogs: {
          create: [
            { name: "Жим лёжа", muscleGroup: "Грудь", sets: 4, repsPerSet: 8, weightKg: 60 },
          ],
        },
      },
    });
  }

  console.log(`Seeded demo user: ${email} / demo12345`);
}

interface SeedIngredient {
  name: string;
  grams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

interface SeedRecipe {
  name: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  servings: number;
  instructions: string;
  ingredients: SeedIngredient[];
}

// Hardcoded per-100g macros (not fetched from Open Food Facts) - this
// sandbox's Node fetch hangs reaching world.openfoodfacts.org (confirmed a
// sandbox networking quirk, not a code bug), so seed data sidesteps it
// entirely for automated verification. Real recipes built through the UI
// still go through the normal FoodSearchCombobox/OFF flow.
const SEED_RECIPES: SeedRecipe[] = [
  {
    name: "Овсянка с бананом",
    mealType: "BREAKFAST",
    servings: 1,
    instructions: "1. Залить овсянку горячей водой или молоком.\n2. Нарезать банан, добавить в кашу.\n3. Дать настояться 5 минут.",
    ingredients: [
      { name: "Овсяные хлопья", grams: 60, caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9 },
      { name: "Банан", grams: 120, caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3 },
    ],
  },
  {
    name: "Омлет с сыром",
    mealType: "BREAKFAST",
    servings: 1,
    instructions: "1. Взбить яйца.\n2. Вылить на разогретую сковороду.\n3. Посыпать тёртым сыром, накрыть крышкой на 2 минуты.",
    ingredients: [
      { name: "Яйца", grams: 150, caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
      { name: "Сыр твёрдый", grams: 30, caloriesPer100g: 350, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 28 },
    ],
  },
  {
    name: "Куриная грудка с рисом",
    mealType: "LUNCH",
    servings: 2,
    instructions: "1. Отварить рис.\n2. Обжарить куриную грудку кусочками до готовности.\n3. Подавать вместе.",
    ingredients: [
      { name: "Куриная грудка", grams: 200, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      { name: "Рис отварной", grams: 150, caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
    ],
  },
  {
    name: "Гречка с говядиной",
    mealType: "LUNCH",
    servings: 2,
    instructions: "1. Отварить гречку.\n2. Обжарить говядину до готовности.\n3. Смешать перед подачей.",
    ingredients: [
      { name: "Гречка отварная", grams: 150, caloriesPer100g: 110, proteinPer100g: 3.9, carbsPer100g: 21.3, fatPer100g: 1 },
      { name: "Говядина", grams: 200, caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15 },
    ],
  },
  {
    name: "Лосось с брокколи",
    mealType: "DINNER",
    servings: 2,
    instructions: "1. Запечь лосось в духовке 15 минут при 200°C.\n2. Отварить или приготовить на пару брокколи.\n3. Подавать вместе.",
    ingredients: [
      { name: "Лосось", grams: 200, caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
      { name: "Брокколи", grams: 150, caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
    ],
  },
  {
    name: "Творог с ягодами",
    mealType: "DINNER",
    servings: 2,
    instructions: "1. Выложить творог в тарелку.\n2. Добавить ягоды.\n3. Перемешать перед подачей.",
    ingredients: [
      { name: "Творог", grams: 200, caloriesPer100g: 98, proteinPer100g: 18, carbsPer100g: 3.3, fatPer100g: 1.8 },
      { name: "Ягоды свежие", grams: 100, caloriesPer100g: 43, proteinPer100g: 0.7, carbsPer100g: 9.7, fatPer100g: 0.3 },
    ],
  },
  {
    name: "Йогурт с миндалём",
    mealType: "SNACK",
    servings: 1,
    instructions: "1. Выложить йогурт в стакан.\n2. Посыпать нарезанным миндалём.",
    ingredients: [
      { name: "Йогурт натуральный", grams: 150, caloriesPer100g: 61, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3 },
      { name: "Миндаль", grams: 20, caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
    ],
  },
  {
    name: "Протеиновый батончик домашний",
    mealType: "SNACK",
    servings: 1,
    instructions: "1. Смешать протеин с арахисовой пастой до однородной массы.\n2. Сформировать батончик.\n3. Убрать в холодильник на 30 минут.",
    ingredients: [
      { name: "Протеин сывороточный", grams: 30, caloriesPer100g: 380, proteinPer100g: 80, carbsPer100g: 5, fatPer100g: 3 },
      { name: "Арахисовая паста", grams: 20, caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
    ],
  },
];

async function seedDemoRecipes(userId: string) {
  const existing = await prisma.recipe.count({ where: { userId } });
  if (existing > 0) return;

  for (const recipe of SEED_RECIPES) {
    const perServing = computeRecipeMacrosPerServing(
      recipe.ingredients.map((i) => ({
        grams: i.grams,
        per100g: {
          caloriesPer100g: i.caloriesPer100g,
          proteinPer100g: i.proteinPer100g,
          carbsPer100g: i.carbsPer100g,
          fatPer100g: i.fatPer100g,
        },
      })),
      recipe.servings,
    );

    await prisma.recipe.create({
      data: {
        userId,
        name: recipe.name,
        mealType: recipe.mealType,
        servings: recipe.servings,
        instructions: recipe.instructions,
        caloriesPerServing: perServing.calories,
        proteinPerServing: perServing.protein,
        carbsPerServing: perServing.carbs,
        fatPerServing: perServing.fat,
        ingredients: { create: recipe.ingredients },
      },
    });
  }

  console.log(`Seeded ${SEED_RECIPES.length} demo recipes`);
}

async function main() {
  await seedSystemExercises();
  await seedDemoUser();

  const demoUser = await prisma.user.findUniqueOrThrow({ where: { email: "demo@fuel.local" } });
  await seedDemoRecipes(demoUser.id);

  console.log(`Seeded ${SYSTEM_EXERCISES.length} system exercises`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
