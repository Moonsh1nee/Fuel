-- CreateTable
CREATE TABLE "CustomFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caloriesPer100g" REAL,
    "proteinPer100g" REAL,
    "carbsPer100g" REAL,
    "fatPer100g" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomFoodComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customFoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grams" REAL NOT NULL,
    "caloriesPer100g" REAL,
    "proteinPer100g" REAL,
    "carbsPer100g" REAL,
    "fatPer100g" REAL,
    CONSTRAINT "CustomFoodComponent_customFoodId_fkey" FOREIGN KEY ("customFoodId") REFERENCES "CustomFood" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CustomFood_userId_idx" ON "CustomFood"("userId");

-- CreateIndex
CREATE INDEX "CustomFoodComponent_customFoodId_idx" ON "CustomFoodComponent"("customFoodId");
