export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { clearCustomerSession } from '@/lib/customer';

export async function POST() {
  await clearCustomerSession();
  const res = NextResponse.json({ success: true });
  res.cookies.set('customer_session', '', { path: '/', maxAge: 0 });
  return res;
}
