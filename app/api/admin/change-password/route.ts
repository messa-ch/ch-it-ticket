export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionAdmin, setSessionCookie } from '@/lib/admin';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const valid = verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
    }

    const newHash = hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    await setSessionCookie(admin.email, newHash);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
