-- AlterTable
ALTER TABLE "tracked_habits" ADD COLUMN     "identityId" TEXT;

-- CreateIndex
CREATE INDEX "tracked_habits_identityId_idx" ON "tracked_habits"("identityId");

-- AddForeignKey
ALTER TABLE "tracked_habits" ADD CONSTRAINT "tracked_habits_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identity_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
