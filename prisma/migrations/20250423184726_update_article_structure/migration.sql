/*
  Warnings:

  - You are about to drop the column `positionX` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `positionY` on the `article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "article" DROP COLUMN "positionX",
DROP COLUMN "positionY",
ADD COLUMN     "position_x" DOUBLE PRECISION,
ADD COLUMN     "position_y" DOUBLE PRECISION,
ADD COLUMN     "radius" DOUBLE PRECISION;
