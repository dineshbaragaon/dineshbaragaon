-- CreateEnum
CREATE TYPE "Competitor" AS ENUM ('AIRWALLEX', 'PAYONEER', 'WISE', 'WORLDFIRST', 'OTHER');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('LIKED', 'COMMENTED', 'SHARED', 'FOLLOWED', 'OTHER');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "competitor" "Competitor",
ADD COLUMN     "competitorOther" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "engagementType" "EngagementType";
