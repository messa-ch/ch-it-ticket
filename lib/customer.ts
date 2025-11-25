import { cookies } from 'next/headers';
import { signSession, verifySession } from './auth';

const CUSTOMER_COOKIE = 'customer_session';
const CUSTOMER_MAX_AGE = 60 * 30; // 30 minutes
const secureCookie = process.env.NODE_ENV === 'production';

function getCookieDomain() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const value = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  try {
    const url = new URL(value);
    const hostname = url.hostname;
    // Avoid setting domain for localhost or invalid hostnames
    if (!hostname || hostname === 'localhost') return undefined;
    return hostname;
  } catch {
    return undefined;
  }
}

function buildCustomerSessionCookie(email: string) {
  const token = signSession({ email, scope: 'customer' });
  return {
    name: CUSTOMER_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: secureCookie,
      path: '/',
      maxAge: CUSTOMER_MAX_AGE,
      domain: getCookieDomain(),
    },
  };
}

export async function setCustomerSession(email: string) {
  const cookieStore = await cookies();
  const cookie = buildCustomerSessionCookie(email);
  cookieStore.set(cookie.name, cookie.value, cookie.options);
}

export function getCustomerSessionCookie(email: string) {
  return buildCustomerSessionCookie(email);
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getCustomerSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const payload = verifySession<{ email: string; scope?: string }>(token);
  if (!payload?.email) {
    console.warn('[customer auth] invalid session token');
    return null;
  }
  return payload.email.toLowerCase();
}
