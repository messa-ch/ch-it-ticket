-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "rating" INTEGER;

-- CreateTable
CREATE TABLE "CustomerLoginToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerLoginToken_pkey" PRIMARY KEY ("id")
);
