-- CreateTable
CREATE TABLE "tracked_habits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "tracked_habits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracked_habits_userId_idx" ON "tracked_habits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_habits_userId_name_key" ON "tracked_habits"("userId", "name");

-- AddForeignKey
ALTER TABLE "tracked_habits" ADD CONSTRAINT "tracked_habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
