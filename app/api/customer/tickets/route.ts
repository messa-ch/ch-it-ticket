export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSessionEmail } from '@/lib/customer';

export async function GET() {
  const email = getCustomerSessionEmail();
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tickets = await prisma.ticket.findMany({
    where: { email },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ tickets });
}
