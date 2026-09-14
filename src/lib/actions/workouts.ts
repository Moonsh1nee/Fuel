"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeVolume, evaluateRecord } from "@/lib/personal-record-calc";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// --- Workout plans ---

const workoutPlanSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
});

export async function listWorkoutPlans() {
  const userId = await requireUserId();
  return prisma.workoutPlan.findMany({
    where: { userId },
    include: { exercises: { orderBy: { orderInPlan: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWorkoutPlan(input: unknown) {
  const userId = await requireUserId();
  const data = workoutPlanSchema.parse(input);
  const plan = await prisma.workoutPlan.create({ data: { ...data, userId } });
  revalidatePath("/workouts");
  return plan;
}

export async function updateWorkoutPlan(id: string, input: unknown) {
  const userId = await requireUserId();
  const data = workoutPlanSchema.partial().extend({ isArchived: z.boolean().optional() }).parse(input);
  await prisma.workoutPlan.updateMany({ where: { id, userId }, data });
  revalidatePath("/workouts");
}

export async function deleteWorkoutPlan(id: string) {
  const userId = await requireUserId();
  await prisma.workoutPlan.deleteMany({ where: { id, userId } });
  revalidatePath("/workouts");
}

const planExerciseSchema = z.object({
  name: z.string().min(1).max(150),
  muscleGroup: z.string().max(100).optional(),
  sets: z.number().int().min(1).optional(),
  repsPerSet: z.number().int().min(1).optional(),
  weightKg: z.number().min(0).optional(),
  orderInPlan: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
});

export async function createPlanExercise(planId: string, input: unknown) {
  const userId = await requireUserId();
  const plan = await prisma.workoutPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new Error("Plan not found");

  const data = planExerciseSchema.parse(input);
  const exercise = await prisma.planExercise.create({ data: { ...data, planId } });
  revalidatePath("/workouts");
  return exercise;
}

export async function deletePlanExercise(id: string) {
  const userId = await requireUserId();
  const exercise = await prisma.planExercise.findFirst({ where: { id }, include: { plan: true } });
  if (!exercise || exercise.plan.userId !== userId) throw new Error("Not found");
  await prisma.planExercise.delete({ where: { id } });
  revalidatePath("/workouts");
}

// --- Workout logs + exercise logs (with auto PR detection) ---

const exerciseSetSchema = z.object({
  name: z.string().min(1).max(150),
  muscleGroup: z.string().max(100).optional(),
  sets: z.number().int().min(1).optional(),
  repsPerSet: z.number().int().min(1).optional(),
  weightKg: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

const workoutLogSchema = z.object({
  planId: z.string().optional(),
  date: z.coerce.date(),
  durationMinutes: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
  exercises: z.array(exerciseSetSchema).default([]),
});

export async function listWorkoutLogs(limit = 30) {
  const userId = await requireUserId();
  return prisma.workoutLog.findMany({
    where: { userId },
    include: { exerciseLogs: true, plan: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function listWorkoutLogsRange(start: Date, end: Date) {
  const userId = await requireUserId();
  return prisma.workoutLog.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { exerciseLogs: true },
    orderBy: { date: "asc" },
  });
}

async function detectAndRecordPersonalRecord(
  userId: string,
  workoutLogId: string,
  exercise: z.infer<typeof exerciseSetSchema>,
  achievedAt: Date,
) {
  if (!exercise.weightKg || !exercise.repsPerSet || !exercise.sets) return;

  const candidateValue = computeVolume(exercise.weightKg, exercise.repsPerSet, exercise.sets);

  const priorBest = await prisma.personalRecord.findFirst({
    where: { userId, exerciseName: exercise.name, recordType: "max_volume" },
    orderBy: { value: "desc" },
  });

  const { isNewRecord } = evaluateRecord(candidateValue, priorBest?.value ?? null);
  if (!isNewRecord) return;

  await prisma.personalRecord.create({
    data: {
      userId,
      exerciseName: exercise.name,
      recordType: "max_volume",
      value: candidateValue,
      unit: "kg",
      achievedAt,
      workoutLogId,
    },
  });
}

export async function createWorkoutLog(input: unknown) {
  const userId = await requireUserId();
  const { exercises, ...data } = workoutLogSchema.parse(input);

  const log = await prisma.workoutLog.create({
    data: {
      ...data,
      userId,
      exerciseLogs: { create: exercises },
    },
    include: { exerciseLogs: true },
  });

  for (const exercise of exercises) {
    await detectAndRecordPersonalRecord(userId, log.id, exercise, data.date);
  }

  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return log;
}

export async function deleteWorkoutLog(id: string) {
  const userId = await requireUserId();
  await prisma.workoutLog.deleteMany({ where: { id, userId } });
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}

// --- Exercise library ---

export async function listExerciseLibrary(query?: string) {
  const userId = await requireUserId();
  return prisma.exerciseTemplate.findMany({
    where: {
      OR: [{ isSystem: true }, { userId }],
      ...(query ? { name: { contains: query } } : {}),
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

const exerciseTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  muscleGroup: z.string().min(1).max(30),
  equipment: z.string().min(1).max(30),
});

export async function createExerciseTemplate(input: unknown) {
  const userId = await requireUserId();
  const data = exerciseTemplateSchema.parse(input);
  const template = await prisma.exerciseTemplate.create({ data: { ...data, userId } });
  revalidatePath("/workouts");
  return template;
}

// --- Personal records (manual entry) ---

const personalRecordSchema = z.object({
  exerciseTemplateId: z.string().optional(),
  exerciseName: z.string().min(1).max(200),
  recordType: z.enum(["max_weight", "max_reps", "max_volume"]),
  value: z.number(),
  unit: z.string().min(1).max(20),
  achievedAt: z.coerce.date(),
  workoutLogId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function listPersonalRecords() {
  const userId = await requireUserId();
  return prisma.personalRecord.findMany({
    where: { userId },
    include: { exerciseTemplate: { select: { name: true } } },
    orderBy: { achievedAt: "desc" },
  });
}

export async function createPersonalRecord(input: unknown) {
  const userId = await requireUserId();
  const data = personalRecordSchema.parse(input);

  const priorBest = await prisma.personalRecord.findFirst({
    where: {
      userId,
      recordType: data.recordType,
      ...(data.exerciseTemplateId
        ? { exerciseTemplateId: data.exerciseTemplateId }
        : { exerciseName: data.exerciseName }),
    },
    orderBy: { value: "desc" },
  });

  const { isNewRecord } = evaluateRecord(data.value, priorBest?.value ?? null);

  const record = await prisma.personalRecord.create({ data: { ...data, userId } });
  revalidatePath("/workouts");
  return { record, isNewRecord, previousRecord: priorBest ?? null };
}
