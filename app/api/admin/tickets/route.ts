export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionAdmin } from '@/lib/admin';

export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ tickets });
}
