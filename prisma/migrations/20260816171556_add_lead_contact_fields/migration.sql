-- CreateEnum
CREATE TYPE "LeadUrgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "city" TEXT,
ADD COLUMN     "urgency" "LeadUrgency" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "whatsappNumber" TEXT;
