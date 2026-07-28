-- AlterTable
ALTER TABLE "checklists" ADD COLUMN     "customEntries" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'habit-assessment',
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "fields" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistTemplate_userId_idx" ON "ChecklistTemplate"("userId");

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
