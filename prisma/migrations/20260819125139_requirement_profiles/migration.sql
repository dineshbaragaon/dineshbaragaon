-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "requirementProfileId" TEXT;

-- CreateTable
CREATE TABLE "RequirementProfile" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RequirementProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementAssignment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,

    CONSTRAINT "RequirementAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequirementAssignment_profileId_freelancerId_key" ON "RequirementAssignment"("profileId", "freelancerId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_requirementProfileId_fkey" FOREIGN KEY ("requirementProfileId") REFERENCES "RequirementProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementProfile" ADD CONSTRAINT "RequirementProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementAssignment" ADD CONSTRAINT "RequirementAssignment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "RequirementProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementAssignment" ADD CONSTRAINT "RequirementAssignment_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
