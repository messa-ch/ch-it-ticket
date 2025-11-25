export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { setSessionCookie } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || '');
    const password = String(body.password || '');

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const resetToken = await prisma.adminResetToken.findUnique({
      where: { token },
      include: { admin: true },
    });

    if (
      !resetToken ||
      resetToken.used ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: resetToken.adminId },
        data: { passwordHash },
      }),
      prisma.adminResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await setSessionCookie(resetToken.admin.email, passwordHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
