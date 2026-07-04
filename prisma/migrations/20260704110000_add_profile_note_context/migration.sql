ALTER TABLE "notes"
ADD COLUMN "profileEntityType" TEXT,
ADD COLUMN "profileEntityId" TEXT;

CREATE INDEX "notes_userId_profileEntityType_profileEntityId_idx"
ON "notes"("userId", "profileEntityType", "profileEntityId");