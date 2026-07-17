-- CreateTable
CREATE TABLE "habit_check_ins" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "habitId" TEXT NOT NULL,

    CONSTRAINT "habit_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "habit_check_ins_habitId_idx" ON "habit_check_ins"("habitId");

-- CreateIndex
CREATE UNIQUE INDEX "habit_check_ins_habitId_date_key" ON "habit_check_ins"("habitId", "date");

-- AddForeignKey
ALTER TABLE "habit_check_ins" ADD CONSTRAINT "habit_check_ins_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "tracked_habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
