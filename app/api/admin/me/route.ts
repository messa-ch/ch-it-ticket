export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSessionAdmin } from '@/lib/admin';

export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: admin.email });
}
