import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import argon2 from "argon2";

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

async function main() {
  await seedSystemExercises();
  await seedDemoUser();
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
