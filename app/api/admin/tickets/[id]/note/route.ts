export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionAdmin } from '@/lib/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const note =
    typeof body.note === 'string' ? body.note.trim() : null;

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { note },
  });

  if (note) {
    await prisma.ticketNote.create({
      data: {
        ticketId: id,
        author: 'ADMIN',
        authorRef: admin.email,
        body: note,
      },
    });
  }

  return NextResponse.json({ ticket });
}
