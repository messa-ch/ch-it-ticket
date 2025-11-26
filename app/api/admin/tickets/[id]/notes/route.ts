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
  const notes = await prisma.ticketNote.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ notes });
}
