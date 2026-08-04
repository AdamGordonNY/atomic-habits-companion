/*
  Warnings:

  - You are about to drop the column `templateType` on the `checklists` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "habit_check_ins" DROP CONSTRAINT "habit_check_ins_habitId_fkey";

-- AlterTable
ALTER TABLE "checklists" DROP COLUMN "templateType",
ADD COLUMN     "habitId" TEXT,
ALTER COLUMN "customEntries" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "habit_check_ins" ADD COLUMN     "trackedHabitId" TEXT;

-- CreateTable
CREATE TABLE "identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,
    "currentSystem" TEXT NOT NULL DEFAULT '',
    "systemEval" TEXT NOT NULL DEFAULT '',
    "systemRating" INTEGER NOT NULL DEFAULT 0,
    "idealSystem" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'building',
    "cue" TEXT NOT NULL DEFAULT '',
    "time" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HabitCheckInToTrackedHabit" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HabitCheckInToTrackedHabit_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "identities_userId_idx" ON "identities"("userId");

-- CreateIndex
CREATE INDEX "goals_identityId_idx" ON "goals"("identityId");

-- CreateIndex
CREATE INDEX "habits_userId_idx" ON "habits"("userId");

-- CreateIndex
CREATE INDEX "habits_goalId_idx" ON "habits"("goalId");

-- CreateIndex
CREATE INDEX "_HabitCheckInToTrackedHabit_B_index" ON "_HabitCheckInToTrackedHabit"("B");

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HabitCheckInToTrackedHabit" ADD CONSTRAINT "_HabitCheckInToTrackedHabit_A_fkey" FOREIGN KEY ("A") REFERENCES "habit_check_ins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HabitCheckInToTrackedHabit" ADD CONSTRAINT "_HabitCheckInToTrackedHabit_B_fkey" FOREIGN KEY ("B") REFERENCES "tracked_habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
