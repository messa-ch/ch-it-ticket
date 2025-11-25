-- Ensure pgcrypto for gen_random_uuid (used by Prisma's uuid default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Ticket table if it doesn't exist (covers environments created before migrations)
CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN'
);

-- Add newer columns if they don't exist
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "rating" INTEGER;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "urgency" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "feedback" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "issueType" TEXT NOT NULL DEFAULT 'GENERAL';
