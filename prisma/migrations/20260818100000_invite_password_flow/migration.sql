-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordSetToken" TEXT,
ADD COLUMN     "passwordSetTokenExpires" TIMESTAMP(3),
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordSetToken_key" ON "User"("passwordSetToken");

