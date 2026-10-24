-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('SIMPLE', 'MODERATE', 'COMPLEX');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('NORMAL', 'RUSH', 'URGENT');

-- CreateTable
CREATE TABLE "pricing_estimates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "hourlyRate" DECIMAL(12,2) NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "complexity" "Complexity" NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "extras" JSONB NOT NULL,
    "taxRate" DECIMAL(5,2),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "tax" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "aiSuggestion" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_estimates_userId_createdAt_idx" ON "pricing_estimates"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "pricing_estimates" ADD CONSTRAINT "pricing_estimates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
