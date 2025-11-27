-- AlterTable
ALTER TABLE "task" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Set completedAt for existing completed tasks based on their updatedAt
UPDATE "task" 
SET "completedAt" = "updatedAt" 
WHERE status = 'completed' AND "completedAt" IS NULL;
