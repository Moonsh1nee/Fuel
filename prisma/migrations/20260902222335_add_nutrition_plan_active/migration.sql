-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NutritionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetCalories" INTEGER,
    "targetProtein" REAL,
    "targetCarbs" REAL,
    "targetFat" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_NutritionPlan" ("createdAt", "description", "id", "name", "sourceId", "targetCalories", "targetCarbs", "targetFat", "targetProtein", "updatedAt", "userId") SELECT "createdAt", "description", "id", "name", "sourceId", "targetCalories", "targetCarbs", "targetFat", "targetProtein", "updatedAt", "userId" FROM "NutritionPlan";
DROP TABLE "NutritionPlan";
ALTER TABLE "new_NutritionPlan" RENAME TO "NutritionPlan";
CREATE UNIQUE INDEX "NutritionPlan_sourceId_key" ON "NutritionPlan"("sourceId");
CREATE INDEX "NutritionPlan_userId_idx" ON "NutritionPlan"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
