-- AlterTable
ALTER TABLE "tracked_habits" ADD COLUMN     "goalEntryId" TEXT;

-- CreateTable
CREATE TABLE "habit_cues" (
    "id" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "isBreaking" BOOLEAN NOT NULL DEFAULT false,
    "reflection" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "habitId" TEXT NOT NULL,

    CONSTRAINT "habit_cues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habit_cues_habitId_idx" ON "habit_cues"("habitId");

-- CreateIndex
CREATE INDEX "habit_cues_createdAt_idx" ON "habit_cues"("createdAt");

-- CreateIndex
CREATE INDEX "tracked_habits_goalEntryId_idx" ON "tracked_habits"("goalEntryId");

-- AddForeignKey
ALTER TABLE "tracked_habits" ADD CONSTRAINT "tracked_habits_goalEntryId_fkey" FOREIGN KEY ("goalEntryId") REFERENCES "next_step_goal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_cues" ADD CONSTRAINT "habit_cues_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "tracked_habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
