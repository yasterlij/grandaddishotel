import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const AUTH_COOKIE_NAME = 'gah_admin_session';

/** Admin sessions expire after 24 hours (issued-at is embedded in the token). */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';

/**
 * The HMAC signing secret.
 *
 * - Production: MUST be provided via ADMIN_SECRET_KEY. When missing, admin
 *   authentication fails closed (no token can ever validate) instead of
 *   falling back to a guessable committed secret.
 * - Development: falls back to a fixed local secret so sessions keep working
 *   without any configuration.
 */
function getSecretKey(): string | null {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (secret && secret.length >= 16) return secret;
  if (isProduction) {
    console.error(
      '[auth] ADMIN_SECRET_KEY is not configured (or shorter than 16 chars). ' +
        'Admin authentication is disabled until it is set.'
    );
    return null;
  }
  return 'grand-addis-hotel-dev-only-secret';
}

/** Length-safe, timing-safe string comparison (hash first to hide length). */
function secretsMatch(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

export interface AdminUser {
  username: string;
  role: string;
  loginTime: number;
}

export function generateToken(username: string): string {
  const secret = getSecretKey();
  if (!secret) throw new Error('Admin auth is not configured');

  const payload = JSON.stringify({
    username,
    role: 'Super Administrator',
    loginTime: Date.now(),
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): AdminUser | null {
  const secret = getSecretKey();
  if (!secret) return null;

  try {
    const dotIndex = token.indexOf('.');
    if (dotIndex <= 0 || dotIndex === token.length - 1) return null;
    const encoded = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encoded)
      .digest('base64url');

    if (!secretsMatch(signature, expectedSignature)) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));

    // Validate payload shape before using it — a malformed payload must never
    // pass the expiry check (e.g. missing loginTime would yield NaN comparisons).
    if (
      !payload ||
      typeof payload.username !== 'string' ||
      typeof payload.loginTime !== 'number' ||
      !Number.isFinite(payload.loginTime)
    ) {
      return null;
    }
    if (Date.now() - payload.loginTime > SESSION_TTL_MS) return null;

    return payload as AdminUser;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Guard for admin API route handlers.
 *
 * Usage:
 *   const unauthorized = await requireAdmin();
 *   if (unauthorized) return unauthorized;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Validate admin credentials.
 *
 * - Production: only ADMIN_USERNAME / ADMIN_PASSWORD from the environment are
 *   accepted; if they are not configured, login is impossible (fail closed).
 * - Development: the env vars take precedence, otherwise a single documented
 *   default pair (admin / GrandAddis2026!) is accepted for local convenience.
 *
 * There is deliberately no PIN backdoor and no credential matrix.
 */
export function validateCredentials(identifier: string, secret: string): boolean {
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;

  if (isProduction) {
    if (!envUser || !envPass) return false;
    return (
      secretsMatch(identifier.trim().toLowerCase(), envUser.trim().toLowerCase()) &&
      secretsMatch(secret.trim(), envPass)
    );
  }

  const user = envUser || 'admin';
  const pass = envPass || 'GrandAddis2026!';
  return (
    secretsMatch(identifier.trim().toLowerCase(), user.trim().toLowerCase()) &&
    secretsMatch(secret.trim(), pass)
  );
}

export { AUTH_COOKIE_NAME };
