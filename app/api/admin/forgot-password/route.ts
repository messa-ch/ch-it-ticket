export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allowedAdminEmails } from '@/lib/admin';
import { getMailer, getFromAddress } from '@/lib/mailer';
import crypto from 'crypto';

const RESET_EXPIRY_MINUTES = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();

    if (!allowedAdminEmails.has(email)) {
      return NextResponse.json({ success: true }); // hide existence
    }

    let admin = await prisma.adminUser.findUnique({ where: { email } });
    // If allowed email exists but no admin row yet, create it so reset works.
    if (!admin) {
      admin = await prisma.adminUser.create({
        data: {
          email,
          passwordHash: crypto.randomUUID(), // placeholder; will be replaced on reset
        },
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000);

    await prisma.adminResetToken.create({
      data: {
        token,
        expiresAt,
        adminId: admin.id,
      },
    });

    const mailer = getMailer();
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/reset-password?token=${token}`;

    try {
      await mailer.sendMail({
        from: getFromAddress(),
        to: email,
        subject: 'Reset your admin password',
        text: `Use this link to reset your password: ${resetUrl}\nThis link expires in ${RESET_EXPIRY_MINUTES} minutes.`,
        html: `<p>Use this link to reset your password (expires in ${RESET_EXPIRY_MINUTES} minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (sendError) {
      console.error('Forgot password email failed', sendError);
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
