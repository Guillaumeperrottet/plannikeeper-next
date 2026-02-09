/*
  Warnings:

  - You are about to drop the column `autoArchiveDelay` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `autoArchiveEnabled` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "autoArchiveDelay",
DROP COLUMN "autoArchiveEnabled";

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "object_access_userId_accessLevel_idx" ON "object_access"("userId", "accessLevel");

-- CreateIndex
CREATE INDEX "task_status_realizationDate_idx" ON "task"("status", "realizationDate");

-- CreateIndex
CREATE INDEX "task_archived_status_idx" ON "task"("archived", "status");

-- CreateIndex
CREATE INDEX "task_assignedToId_status_idx" ON "task"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "task_articleId_archived_idx" ON "task"("articleId", "archived");
