export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionAdmin } from '@/lib/admin';
import { getMailer, getFromAddress } from '@/lib/mailer';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await request.json();
  const allowed = ['OPEN', 'IN PROGRESS', 'CLOSED'];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: { status },
  });

  if (status === 'CLOSED') {
    try {
      const mailer = getMailer();
      await mailer.sendMail({
        from: getFromAddress(),
        to: ticket.email,
        subject: `Your ticket "${ticket.subject}" has been closed`,
        text: `Hi ${ticket.name},\n\nWe have closed your ticket "${ticket.subject}". If you have feedback, please rate the ticket in the customer portal.\n\nThank you,\nSupport`,
      });
    } catch (error) {
      console.error('Failed to send closure email', error);
    }
  }

  return NextResponse.json({ ticket });
}
