/*
  Warnings:

  - You are about to drop the column `createdAt` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `trackedHabitId` on the `habit_check_ins` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `habits` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `identities` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `identities` table. All the data in the column will be lost.
  - You are about to drop the `ChecklistTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_HabitCheckInToTrackedHabit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `assessment_next_step` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `habit_cues` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `identity_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tracked_habits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assessment_next_step" DROP CONSTRAINT "assessment_next_step_userId_fkey";

-- DropForeignKey
ALTER TABLE "checklists" DROP CONSTRAINT "checklists_templateId_fkey";

-- DropForeignKey
ALTER TABLE "habit_cues" DROP CONSTRAINT "habit_cues_habitId_fkey";

-- DropForeignKey
ALTER TABLE "identity_records" DROP CONSTRAINT "identity_records_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "next_step_goal_entries" DROP CONSTRAINT "next_step_goal_entries_identityId_fkey";

-- DropForeignKey
ALTER TABLE "next_step_goal_entries" DROP CONSTRAINT "next_step_goal_entries_nextStepId_fkey";

-- DropForeignKey
ALTER TABLE "tracked_habits" DROP CONSTRAINT "tracked_habits_goalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "tracked_habits" DROP CONSTRAINT "tracked_habits_identityId_fkey";

-- DropForeignKey
ALTER TABLE "tracked_habits" DROP CONSTRAINT "tracked_habits_userId_fkey";

-- DropIndex
DROP INDEX "checklists_createdAt_idx";

-- DropIndex
DROP INDEX "habits_userId_idx";

-- AlterTable
ALTER TABLE "checklists" ALTER COLUMN "title" SET DEFAULT 'Checklist';

-- AlterTable
ALTER TABLE "goals" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "habit_check_ins" DROP COLUMN "trackedHabitId";

-- AlterTable
ALTER TABLE "habits" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "identities" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "ChecklistTemplate";

-- DropTable
DROP TABLE "_HabitCheckInToTrackedHabit";

-- DropTable
DROP TABLE "assessment_next_step";

-- DropTable
DROP TABLE "habit_cues";

-- DropTable
DROP TABLE "identity_records";

-- DropTable
DROP TABLE "tracked_habits";

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "fields" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_templates_userId_idx" ON "checklist_templates"("userId");

-- CreateIndex
CREATE INDEX "checklists_habitId_idx" ON "checklists"("habitId");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identities" ADD CONSTRAINT "identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
