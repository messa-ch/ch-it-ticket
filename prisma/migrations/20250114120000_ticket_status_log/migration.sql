-- CreateTable
CREATE TABLE IF NOT EXISTS "TicketStatusLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "ticketId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AddForeignKey
ALTER TABLE "TicketStatusLog"
ADD CONSTRAINT "TicketStatusLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
