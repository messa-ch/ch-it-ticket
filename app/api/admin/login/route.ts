export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { allowedAdminEmails, setSessionCookie } from '@/lib/admin';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');

    if (!allowedAdminEmails.has(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    let admin = await prisma.adminUser.findUnique({ where: { email } });

    // If the admin does not exist yet, allow first-time creation for allowed email.
    if (!admin) {
      const passwordHash = hashPassword(password);
      admin = await prisma.adminUser.create({
        data: { email, passwordHash },
      });
    } else {
      const valid = verifyPassword(password, admin.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    await setSessionCookie(admin.email, admin.passwordHash);
    return NextResponse.json({ success: true, email: admin.email });
  } catch (error) {
    console.error('Admin login error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
