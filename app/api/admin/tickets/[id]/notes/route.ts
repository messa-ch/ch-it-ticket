export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionAdmin } from '@/lib/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [notes, statusLogs] = await prisma.$transaction([
    prisma.ticketNote.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.ticketStatusLog.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const history = [
    ...notes.map((note) => ({
      id: note.id,
      type: 'NOTE' as const,
      author: note.author,
      authorRef: note.authorRef,
      body: note.body,
      createdAt: note.createdAt,
    })),
    ...statusLogs.map((log) => ({
      id: `status-${log.id}`,
      type: 'STATUS' as const,
      author: 'STATUS',
      authorRef: log.actor,
      body: `Status changed to ${log.toStatus}${log.fromStatus ? ` (from ${log.fromStatus})` : ''}`,
      createdAt: log.createdAt,
      toStatus: log.toStatus,
      fromStatus: log.fromStatus,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return NextResponse.json({ history });
}
