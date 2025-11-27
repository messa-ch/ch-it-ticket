export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionAdmin } from '@/lib/admin';
import { getMailer, getFromAddress } from '@/lib/mailer';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await request.json();
  const { id } = await params;
  const allowed = ['OPEN', 'IN PROGRESS', 'CLOSED', 'REJECTED'];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.status === status) {
    return NextResponse.json({ ticket: existing });
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id },
      data: { status },
    });

    await tx.ticketStatusLog.create({
      data: {
        ticketId: id,
        fromStatus: existing.status,
        toStatus: status,
        actor: admin.email,
      },
    });

    return updated;
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
