export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { clearCustomerSession } from '@/lib/customer';

export async function POST() {
  await clearCustomerSession();
  return NextResponse.json({ success: true });
}
