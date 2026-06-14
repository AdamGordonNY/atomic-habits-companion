-- CreateTable
CREATE TABLE "assessment_next_step" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "assessment_next_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "next_step_goal_entries" (
    "id" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "currentSystem" TEXT NOT NULL DEFAULT '',
    "systemEval" TEXT NOT NULL DEFAULT '',
    "systemRating" INTEGER NOT NULL DEFAULT 0,
    "idealSystem" TEXT NOT NULL DEFAULT '',
    "componentHabits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nextStepId" TEXT NOT NULL,

    CONSTRAINT "next_step_goal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_next_step_userId_key" ON "assessment_next_step"("userId");

-- CreateIndex
CREATE INDEX "next_step_goal_entries_nextStepId_idx" ON "next_step_goal_entries"("nextStepId");

-- AddForeignKey
ALTER TABLE "assessment_next_step" ADD CONSTRAINT "assessment_next_step_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_step_goal_entries" ADD CONSTRAINT "next_step_goal_entries_nextStepId_fkey" FOREIGN KEY ("nextStepId") REFERENCES "assessment_next_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;
