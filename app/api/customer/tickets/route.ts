export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSessionEmail } from '@/lib/customer';

export async function GET() {
  const email = await getCustomerSessionEmail();
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized (no session)' }, { status: 401 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { email },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ tickets });
}
