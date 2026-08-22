-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "registered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "transactionLive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transactionLiveAt" TIMESTAMP(3);
