export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSessionEmail } from '@/lib/customer';
import { getFromAddress, getMailer } from '@/lib/mailer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionEmail = await getCustomerSessionEmail();
    if (!sessionEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket || ticket.email.toLowerCase() !== sessionEmail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (ticket.status === 'OPEN' || ticket.status === 'IN PROGRESS') {
      return NextResponse.json({ error: 'Ticket is already active.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      return NextResponse.json({ error: 'Please provide a reason to reopen this ticket.' }, { status: 400 });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status: 'OPEN',
        note: `${ticket.note ? `${ticket.note}\n\n` : ''}Reopen requested by customer: ${reason}`,
      },
    });

    const transporter = getMailer();
    const from = getFromAddress();

    await transporter.sendMail({
      from,
      to: ['messa@chmoney.co.uk', 'IT@wednesdayfs.co.uk'],
      subject: `Reopen request for ticket ${ticket.id}`,
      text: [
        `Customer ${ticket.name} (${ticket.email}) requested to reopen ticket ${ticket.id}.`,
        `Status: ${updated.status} (was ${ticket.status})`,
        `Website: ${ticket.website}`,
        `Subject: ${ticket.subject}`,
        `Created: ${new Date(ticket.createdAt).toISOString()}`,
        '',
        'Reason to reopen:',
        reason,
        '',
        'Original description:',
        ticket.description,
      ].join('\n'),
      html: `
        <h2>Reopen request for ticket ${ticket.id}</h2>
        <p><strong>Customer:</strong> ${ticket.name} (${ticket.email})</p>
        <p><strong>Status:</strong> ${updated.status} (was ${ticket.status})</p>
        <p><strong>Website:</strong> ${ticket.website}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Created:</strong> ${new Date(ticket.createdAt).toISOString()}</p>
        <h3>Reason to reopen</h3>
        <p>${reason.replace(/\n/g, '<br>')}</p>
        <h3>Original description</h3>
        <p>${ticket.description.replace(/\n/g, '<br>')}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('reopen ticket failed', error);
    return NextResponse.json({ error: 'Failed to request reopen.' }, { status: 500 });
  }
}
