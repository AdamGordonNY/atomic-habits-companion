-- AlterTable
ALTER TABLE "next_step_goal_entries" ADD COLUMN     "identityId" TEXT;

-- CreateIndex
CREATE INDEX "next_step_goal_entries_identityId_idx" ON "next_step_goal_entries"("identityId");

-- AddForeignKey
ALTER TABLE "next_step_goal_entries" ADD CONSTRAINT "next_step_goal_entries_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identity_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
