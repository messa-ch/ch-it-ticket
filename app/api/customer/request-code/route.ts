export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMailer, getFromAddress } from '@/lib/mailer';

const CODE_EXP_MINUTES = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Ensure the user has at least one ticket to avoid spamming unrelated emails.
    const ticketCount = await prisma.ticket.count({ where: { email } });
    if (ticketCount === 0) {
      return NextResponse.json({ error: 'No tickets found for this email' }, { status: 404 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_EXP_MINUTES * 60 * 1000);

    await prisma.customerLoginToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    const mailer = getMailer();
    await mailer.sendMail({
      from: getFromAddress(),
      to: email,
      subject: 'Your ticket portal code',
      text: `Use this code to access your ticket updates: ${code}\nThis code expires in ${CODE_EXP_MINUTES} minutes.`,
      html: `<p>Use this code to access your ticket updates:</p><p style="font-size:20px;font-weight:bold;">${code}</p><p>This code expires in ${CODE_EXP_MINUTES} minutes.</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('customer request-code error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
