import crypto from 'crypto';

const ITERATIONS = 120_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${ITERATIONS}:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [iterStr, salt, key] = stored.split(':');
  const iterations = parseInt(iterStr, 10);
  if (!iterations || !salt || !key) return false;
  const derived = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function signSession(payload: Record<string, string | number>): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${data}.${hmac}`).toString('base64');
}

export function verifySession<T extends Record<string, unknown>>(token: string): T | null {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [data, signature] = decoded.split('.');
    if (!data || !signature) return null;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}
