import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { signSession, verifySession } from './auth';

export const allowedAdminEmails = new Set([
  'messa@chmoney.co.uk',
  'it@wednesdayfs.co.uk',
]);

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 1 day

export async function getSessionAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySession<{ email: string; hash: string }>(token);
  if (!payload?.email || !payload?.hash) return null;
  if (!allowedAdminEmails.has(payload.email)) return null;
  const admin = await prisma.adminUser.findUnique({ where: { email: payload.email } });
  if (!admin) return null;
  if (admin.passwordHash !== payload.hash) return null;
  return admin;
}

export async function setSessionCookie(email: string, passwordHash: string) {
  const cookieStore = await cookies();
  const token = signSession({ email, hash: passwordHash });
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}
