-- CreateTable
CREATE TABLE "assessment_part_four" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "existingCommitments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "desiredCommitments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unwantedCommitments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "idealMorning" TEXT NOT NULL DEFAULT '',
    "idealAfternoon" TEXT NOT NULL DEFAULT '',
    "idealEvening" TEXT NOT NULL DEFAULT '',
    "cleanSlateReflection" TEXT NOT NULL DEFAULT '',
    "majorGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vision6Months" TEXT NOT NULL DEFAULT '',
    "vision2Years" TEXT NOT NULL DEFAULT '',
    "vision5Years" TEXT NOT NULL DEFAULT '',
    "majorChanges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "successDefinition" TEXT NOT NULL DEFAULT '',
    "futureReflection" TEXT NOT NULL DEFAULT '',
    "reflectionGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "assessment_part_four_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_vision_entries" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "vision" TEXT NOT NULL DEFAULT '',
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "domain_vision_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_records" (
    "id" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "habits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "identity_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_part_four_userId_key" ON "assessment_part_four"("userId");

-- CreateIndex
CREATE INDEX "domain_vision_entries_assessmentId_idx" ON "domain_vision_entries"("assessmentId");

-- CreateIndex
CREATE INDEX "identity_records_assessmentId_idx" ON "identity_records"("assessmentId");

-- AddForeignKey
ALTER TABLE "assessment_part_four" ADD CONSTRAINT "assessment_part_four_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_vision_entries" ADD CONSTRAINT "domain_vision_entries_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_part_four"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_records" ADD CONSTRAINT "identity_records_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_part_four"("id") ON DELETE CASCADE ON UPDATE CASCADE;
