-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetCalories" INTEGER,
    "targetProtein" REAL,
    "targetCarbs" REAL,
    "targetFat" REAL,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER,
    "protein" REAL,
    "carbs" REAL,
    "fat" REAL,
    CONSTRAINT "MealTemplate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "NutritionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories" INTEGER,
    "protein" REAL,
    "carbs" REAL,
    "fat" REAL,
    "notes" TEXT,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FoodLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysPerWeek" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT,
    "sets" INTEGER,
    "repsPerSet" INTEGER,
    "weightKg" REAL,
    "orderInPlan" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "PlanExercise_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "date" DATETIME NOT NULL,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutLogId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" TEXT,
    "sets" INTEGER,
    "repsPerSet" INTEGER,
    "weightKg" REAL,
    "notes" TEXT,
    CONSTRAINT "ExerciseLog_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "muscleGroup" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseTemplateId" TEXT,
    "exerciseName" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "achievedAt" DATETIME NOT NULL,
    "workoutLogId" TEXT,
    "notes" TEXT,
    "sourceId" TEXT,
    CONSTRAINT "PersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PersonalRecord_exerciseTemplateId_fkey" FOREIGN KEY ("exerciseTemplateId") REFERENCES "ExerciseTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PersonalRecord_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionPlan_sourceId_key" ON "NutritionPlan"("sourceId");

-- CreateIndex
CREATE INDEX "NutritionPlan_userId_idx" ON "NutritionPlan"("userId");

-- CreateIndex
CREATE INDEX "MealTemplate_planId_idx" ON "MealTemplate"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodLog_sourceId_key" ON "FoodLog"("sourceId");

-- CreateIndex
CREATE INDEX "FoodLog_userId_date_idx" ON "FoodLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutPlan_sourceId_key" ON "WorkoutPlan"("sourceId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_userId_idx" ON "WorkoutPlan"("userId");

-- CreateIndex
CREATE INDEX "PlanExercise_planId_idx" ON "PlanExercise"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_sourceId_key" ON "WorkoutLog"("sourceId");

-- CreateIndex
CREATE INDEX "WorkoutLog_userId_date_idx" ON "WorkoutLog"("userId", "date");

-- CreateIndex
CREATE INDEX "ExerciseLog_workoutLogId_idx" ON "ExerciseLog"("workoutLogId");

-- CreateIndex
CREATE INDEX "ExerciseTemplate_userId_idx" ON "ExerciseTemplate"("userId");

-- CreateIndex
CREATE INDEX "ExerciseTemplate_muscleGroup_idx" ON "ExerciseTemplate"("muscleGroup");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalRecord_sourceId_key" ON "PersonalRecord"("sourceId");

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_idx" ON "PersonalRecord"("userId");

-- CreateIndex
CREATE INDEX "PersonalRecord_exerciseTemplateId_idx" ON "PersonalRecord"("exerciseTemplateId");
