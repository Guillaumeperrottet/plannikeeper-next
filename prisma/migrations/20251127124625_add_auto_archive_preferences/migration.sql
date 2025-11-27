-- AlterTable
ALTER TABLE "user" ADD COLUMN     "autoArchiveDelay" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "autoArchiveEnabled" BOOLEAN NOT NULL DEFAULT true;
