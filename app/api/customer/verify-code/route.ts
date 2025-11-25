export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSessionCookie, setCustomerSession } from '@/lib/customer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').toLowerCase().trim();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const token = await prisma.customerLoginToken.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await prisma.customerLoginToken.update({
      where: { id: token.id },
      data: { used: true },
    });

    await setCustomerSession(email);

    const res = NextResponse.json({ success: true });
    const cookie = getCustomerSessionCookie(email);
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (error) {
    console.error('customer verify-code error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
