-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');

-- CreateTable
CREATE TABLE "gig_descriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "skills" TEXT[],
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "deliveryDays" INTEGER NOT NULL,
    "features" TEXT[],
    "revisions" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "seoKeywords" TEXT[],
    "faqs" JSONB NOT NULL,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gig_descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gig_descriptions_userId_createdAt_idx" ON "gig_descriptions"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "gig_descriptions" ADD CONSTRAINT "gig_descriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
