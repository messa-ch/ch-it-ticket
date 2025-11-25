export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSessionEmail } from '@/lib/customer';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const email = getCustomerSessionEmail();
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
    if (!ticket || ticket.email.toLowerCase() !== email) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (ticket.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Ticket must be CLOSED to rate' }, { status: 400 });
    }

    const body = await request.json();
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    const updated = await prisma.ticket.update({
      where: { id: params.id },
      data: { rating },
    });

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error('customer rating error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
