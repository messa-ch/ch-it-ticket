import { cookies } from 'next/headers';
import { signSession, verifySession } from './auth';

const CUSTOMER_COOKIE = 'customer_session';
const CUSTOMER_MAX_AGE = 60 * 30; // 30 minutes

export async function setCustomerSession(email: string) {
  const cookieStore = cookies();
  const token = signSession({ email, scope: 'customer' });
  cookieStore.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CUSTOMER_MAX_AGE,
  });
}

export function clearCustomerSession() {
  const cookieStore = cookies();
  cookieStore.set(CUSTOMER_COOKIE, '', { path: '/', maxAge: 0 });
}

export function getCustomerSessionEmail(): string | null {
  const cookieStore = cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySession<{ email: string; scope?: string }>(token);
  if (!payload?.email) return null;
  return payload.email.toLowerCase();
}
