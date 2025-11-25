export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/admin';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
