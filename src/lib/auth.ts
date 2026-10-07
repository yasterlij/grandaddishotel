import { cookies } from 'next/headers';
import crypto from 'crypto';

const AUTH_COOKIE_NAME = 'gah_admin_session';
const SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'grand-addis-hotel-super-secret-key-2026';

export interface AdminUser {
  username: string;
  role: string;
  loginTime: number;
}

export function generateToken(username: string): string {
  const payload = JSON.stringify({
    username,
    role: 'Super Administrator',
    loginTime: Date.now(),
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): AdminUser | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(encoded)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    // Token valid for 7 days
    if (Date.now() - payload.loginTime > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }

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

export function validateCredentials(identifier: string, secret: string): boolean {
  const validUsernames = ['admin', 'manager', 'admin@grandaddis.com', 'tamrat'];
  const validPasswords = ['admin', 'GrandAddis2026!', '2026', 'admin123'];

  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;

  if (envUser && identifier.toLowerCase() === envUser.toLowerCase()) {
    if (envPass && secret === envPass) return true;
  }

  const cleanId = identifier.trim().toLowerCase();
  const cleanSecret = secret.trim();

  // Allow either username + password OR quick PIN 2026
  if (cleanSecret === '2026' || cleanSecret === 'GrandAddis2026!' || cleanSecret === 'admin') {
    if (validUsernames.includes(cleanId) || cleanId === 'admin') {
      return true;
    }
  }

  // Also support direct login if user enters 'admin' and password matches any valid password
  if (cleanId === 'admin' && validPasswords.includes(cleanSecret)) {
    return true;
  }

  return false;
}

export { AUTH_COOKIE_NAME };
