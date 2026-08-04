import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient, type MealType } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// One-off migration script: imports a single user's nutrition/workout data
// exported from HabitForge/GetGrip (see
// HabitForge/habitforge-backend/scripts/export_nutrition_workouts_user.py)
// into Fuel. Safe to re-run — every top-level row dedups via `sourceId`
// (the original HabitForge row UUID), so a second run only fills in gaps.
//
// Usage: npx tsx prisma/import-getgrip.ts <path-to-export.json> <email>

function resolveSqlitePath(databaseUrl: string | undefined): string {
  if (!databaseUrl) return "./prisma/dev.db";
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqlitePath(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

interface SourceMealTemplate {
  id: string;
  mealType: string;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface SourceNutritionPlan {
  id: string;
  name: string;
  description: string | null;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  meals: SourceMealTemplate[];
}

interface SourceFoodLog {
  id: string;
  date: string;
  mealType: string;
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
}

interface SourcePlanExercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  sets: number | null;
  repsPerSet: number | null;
  weightKg: number | null;
  orderInPlan: number;
  notes: string | null;
}

interface SourceWorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  daysPerWeek: number | null;
  isArchived: boolean;
  exercises: SourcePlanExercise[];
}

interface SourceExerciseLog {
  id: string;
  name: string;
  muscleGroup: string | null;
  sets: number | null;
  repsPerSet: number | null;
  weightKg: number | null;
  notes: string | null;
}

interface SourceWorkoutLog {
  id: string;
  planId: string | null;
  date: string;
  durationMinutes: number | null;
  notes: string | null;
  exerciseLogs: SourceExerciseLog[];
}

interface SourceExerciseTemplate {
  id: string;
  name: string;
  description: string | null;
  muscleGroup: string;
  equipment: string;
}

interface SourcePersonalRecord {
  id: string;
  exerciseTemplateId: string | null;
  exerciseTemplateName: string | null;
  exerciseName: string;
  recordType: string;
  value: number;
  unit: string;
  achievedAt: string;
  workoutLogId: string | null;
  notes: string | null;
}

interface SourceExport {
  email: string;
  nutritionPlans: SourceNutritionPlan[];
  foodLogs: SourceFoodLog[];
  workoutPlans: SourceWorkoutPlan[];
  workoutLogs: SourceWorkoutLog[];
  customExerciseTemplates: SourceExerciseTemplate[];
  personalRecords: SourcePersonalRecord[];
}

function toMealType(value: string): MealType {
  return value.toUpperCase() as MealType;
}

async function main() {
  const [, , filePath, email] = process.argv;
  if (!filePath || !email) {
    console.error("Usage: npx tsx prisma/import-getgrip.ts <path-to-export.json> <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `Пользователь ${email} не найден в Fuel. Сначала зарегистрируйтесь через форму на /register.`,
    );
    process.exit(1);
  }

  const data: SourceExport = JSON.parse(readFileSync(filePath, "utf-8"));

  // --- Nutrition plans (nested meals) ---
  let plansImported = 0;
  let plansSkipped = 0;
  for (const plan of data.nutritionPlans) {
    const existing = await prisma.nutritionPlan.findUnique({ where: { sourceId: plan.id } });
    if (existing) {
      plansSkipped++;
      continue;
    }
    await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        sourceId: plan.id,
        name: plan.name,
        description: plan.description,
        targetCalories: plan.targetCalories,
        targetProtein: plan.targetProtein,
        targetCarbs: plan.targetCarbs,
        targetFat: plan.targetFat,
        meals: {
          create: plan.meals.map((meal) => ({
            mealType: toMealType(meal.mealType),
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
          })),
        },
      },
    });
    plansImported++;
  }

  // --- Food logs ---
  let foodLogsImported = 0;
  let foodLogsSkipped = 0;
  for (const log of data.foodLogs) {
    const existing = await prisma.foodLog.findUnique({ where: { sourceId: log.id } });
    if (existing) {
      foodLogsSkipped++;
      continue;
    }
    await prisma.foodLog.create({
      data: {
        userId: user.id,
        sourceId: log.id,
        date: new Date(log.date),
        mealType: toMealType(log.mealType),
        name: log.name,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        notes: log.notes,
      },
    });
    foodLogsImported++;
  }

  // --- Custom exercise templates (system ones come from `npm run db:seed`) ---
  const templateNameToFuelId = new Map<string, string>();
  const systemTemplates = await prisma.exerciseTemplate.findMany({ where: { isSystem: true } });
  for (const t of systemTemplates) templateNameToFuelId.set(t.name, t.id);

  let templatesImported = 0;
  let templatesSkipped = 0;
  for (const template of data.customExerciseTemplates) {
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { userId: user.id, name: template.name },
    });
    if (existing) {
      templateNameToFuelId.set(template.name, existing.id);
      templatesSkipped++;
      continue;
    }
    const created = await prisma.exerciseTemplate.create({
      data: {
        userId: user.id,
        name: template.name,
        description: template.description,
        muscleGroup: template.muscleGroup,
        equipment: template.equipment,
        isSystem: false,
      },
    });
    templateNameToFuelId.set(template.name, created.id);
    templatesImported++;
  }

  // --- Workout plans (nested plan exercises) ---
  const planIdMap = new Map<string, string>();
  let workoutPlansImported = 0;
  let workoutPlansSkipped = 0;
  for (const plan of data.workoutPlans) {
    const existing = await prisma.workoutPlan.findUnique({ where: { sourceId: plan.id } });
    if (existing) {
      planIdMap.set(plan.id, existing.id);
      workoutPlansSkipped++;
      continue;
    }
    const created = await prisma.workoutPlan.create({
      data: {
        userId: user.id,
        sourceId: plan.id,
        name: plan.name,
        description: plan.description,
        daysPerWeek: plan.daysPerWeek,
        isArchived: plan.isArchived,
        exercises: {
          create: plan.exercises.map((exercise) => ({
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            sets: exercise.sets,
            repsPerSet: exercise.repsPerSet,
            weightKg: exercise.weightKg,
            orderInPlan: exercise.orderInPlan,
            notes: exercise.notes,
          })),
        },
      },
    });
    planIdMap.set(plan.id, created.id);
    workoutPlansImported++;
  }

  // --- Workout logs (nested exercise logs) ---
  const workoutLogIdMap = new Map<string, string>();
  let workoutLogsImported = 0;
  let workoutLogsSkipped = 0;
  for (const log of data.workoutLogs) {
    const existing = await prisma.workoutLog.findUnique({ where: { sourceId: log.id } });
    if (existing) {
      workoutLogIdMap.set(log.id, existing.id);
      workoutLogsSkipped++;
      continue;
    }
    const created = await prisma.workoutLog.create({
      data: {
        userId: user.id,
        sourceId: log.id,
        planId: log.planId ? (planIdMap.get(log.planId) ?? null) : null,
        date: new Date(log.date),
        durationMinutes: log.durationMinutes,
        notes: log.notes,
        exerciseLogs: {
          create: log.exerciseLogs.map((exercise) => ({
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            sets: exercise.sets,
            repsPerSet: exercise.repsPerSet,
            weightKg: exercise.weightKg,
            notes: exercise.notes,
          })),
        },
      },
    });
    workoutLogIdMap.set(log.id, created.id);
    workoutLogsImported++;
  }

  // --- Personal records (needs template + workout-log maps, so imported last) ---
  let recordsImported = 0;
  let recordsSkipped = 0;
  for (const record of data.personalRecords) {
    const existing = await prisma.personalRecord.findUnique({ where: { sourceId: record.id } });
    if (existing) {
      recordsSkipped++;
      continue;
    }
    const exerciseTemplateId = record.exerciseTemplateName
      ? (templateNameToFuelId.get(record.exerciseTemplateName) ?? null)
      : null;
    const workoutLogId = record.workoutLogId
      ? (workoutLogIdMap.get(record.workoutLogId) ?? null)
      : null;

    await prisma.personalRecord.create({
      data: {
        userId: user.id,
        sourceId: record.id,
        exerciseTemplateId,
        exerciseName: record.exerciseName,
        recordType: record.recordType,
        value: record.value,
        unit: record.unit,
        achievedAt: new Date(record.achievedAt),
        workoutLogId,
        notes: record.notes,
      },
    });
    recordsImported++;
  }

  console.log(`Пользователь: ${email}`);
  console.log(`Планы питания: импортировано ${plansImported}, пропущено дублей ${plansSkipped}`);
  console.log(`Записи еды: импортировано ${foodLogsImported}, пропущено дублей ${foodLogsSkipped}`);
  console.log(
    `Свои упражнения: импортировано ${templatesImported}, переиспользовано ${templatesSkipped}`,
  );
  console.log(
    `Планы тренировок: импортировано ${workoutPlansImported}, пропущено дублей ${workoutPlansSkipped}`,
  );
  console.log(
    `Тренировки: импортировано ${workoutLogsImported}, пропущено дублей ${workoutLogsSkipped}`,
  );
  console.log(`Рекорды: импортировано ${recordsImported}, пропущено дублей ${recordsSkipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
