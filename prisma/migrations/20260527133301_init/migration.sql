-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "contentText" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_part_one" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "personalRating" INTEGER,
    "personalWhy" TEXT NOT NULL DEFAULT '',
    "professionalRating" INTEGER,
    "professionalWhy" TEXT NOT NULL DEFAULT '',
    "topPriorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optimizationWhat" TEXT NOT NULL DEFAULT '',
    "optimizationWhy" TEXT NOT NULL DEFAULT '',
    "obligations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workingWell" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notWorkingWell" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockerWhat" TEXT NOT NULL DEFAULT '',
    "blockerOvercome" TEXT NOT NULL DEFAULT '',
    "blockerWhy" TEXT NOT NULL DEFAULT '',
    "changesWhat" TEXT NOT NULL DEFAULT '',
    "changesWhy" TEXT NOT NULL DEFAULT '',
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "assessment_part_one_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "progress" TEXT NOT NULL DEFAULT '',
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_part_two" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "assessment_part_two_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_logs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "day_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_entries" (
    "id" TEXT NOT NULL,
    "hour" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT '',
    "energyLevel" TEXT NOT NULL DEFAULT 'UP',
    "dayLogId" TEXT NOT NULL,

    CONSTRAINT "hourly_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_part_three" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "majorTimeSpends" TEXT[],
    "highEnergyHoursPerDay" INTEGER,
    "highEnergyHoursList" TEXT[],
    "highEnergyActivities" TEXT NOT NULL DEFAULT '',
    "lowEnergyHours" TEXT[],
    "wantHighEnergySpend" TEXT[],
    "wantLowEnergySpend" TEXT[],
    "timeSinksReflection" TEXT NOT NULL DEFAULT '',
    "stressSource" TEXT NOT NULL DEFAULT '',
    "anticipatedChanges" TEXT NOT NULL DEFAULT '',
    "stickinessPatterns" TEXT NOT NULL DEFAULT '',
    "finalReflection" TEXT NOT NULL DEFAULT '',
    "part1WrapUpReflection" TEXT NOT NULL DEFAULT '',
    "completedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "assessment_part_three_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_records" (
    "id" TEXT NOT NULL,
    "habit" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "beneficialForId" TEXT,
    "successfulForId" TEXT,

    CONSTRAINT "habit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_attempts" (
    "id" TEXT NOT NULL,
    "habit" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "whatDidntWork" TEXT NOT NULL DEFAULT '',
    "obstacle" TEXT NOT NULL DEFAULT '',
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "habit_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_scorecards" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "takeaway" TEXT NOT NULL DEFAULT '',
    "wantToAdd" TEXT[],
    "wantToRemove" TEXT[],
    "morningForId" TEXT,
    "afternoonForId" TEXT,
    "eveningForId" TEXT,

    CONSTRAINT "habit_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_scorecard_entries" (
    "id" TEXT NOT NULL,
    "habit" TEXT NOT NULL,
    "score" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL DEFAULT '',
    "scorecardId" TEXT NOT NULL,

    CONSTRAINT "habit_scorecard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "notes_userId_idx" ON "notes"("userId");

-- CreateIndex
CREATE INDEX "notes_pinned_idx" ON "notes"("pinned");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_part_one_userId_key" ON "assessment_part_one"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_part_two_userId_key" ON "assessment_part_two"("userId");

-- CreateIndex
CREATE INDEX "day_logs_assessmentId_idx" ON "day_logs"("assessmentId");

-- CreateIndex
CREATE INDEX "hourly_entries_dayLogId_idx" ON "hourly_entries"("dayLogId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_part_three_userId_key" ON "assessment_part_three"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "habit_scorecards_morningForId_key" ON "habit_scorecards"("morningForId");

-- CreateIndex
CREATE UNIQUE INDEX "habit_scorecards_afternoonForId_key" ON "habit_scorecards"("afternoonForId");

-- CreateIndex
CREATE UNIQUE INDEX "habit_scorecards_eveningForId_key" ON "habit_scorecards"("eveningForId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_part_one" ADD CONSTRAINT "assessment_part_one_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_part_one"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_part_two" ADD CONSTRAINT "assessment_part_two_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_part_two"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hourly_entries" ADD CONSTRAINT "hourly_entries_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "day_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_part_three" ADD CONSTRAINT "assessment_part_three_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_records" ADD CONSTRAINT "habit_records_beneficialForId_fkey" FOREIGN KEY ("beneficialForId") REFERENCES "assessment_part_three"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_records" ADD CONSTRAINT "habit_records_successfulForId_fkey" FOREIGN KEY ("successfulForId") REFERENCES "assessment_part_three"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_attempts" ADD CONSTRAINT "habit_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment_part_three"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_scorecards" ADD CONSTRAINT "habit_scorecards_morningForId_fkey" FOREIGN KEY ("morningForId") REFERENCES "assessment_part_three"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_scorecards" ADD CONSTRAINT "habit_scorecards_afternoonForId_fkey" FOREIGN KEY ("afternoonForId") REFERENCES "assessment_part_three"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_scorecards" ADD CONSTRAINT "habit_scorecards_eveningForId_fkey" FOREIGN KEY ("eveningForId") REFERENCES "assessment_part_three"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_scorecard_entries" ADD CONSTRAINT "habit_scorecard_entries_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "habit_scorecards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
