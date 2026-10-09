import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, generateToken, AUTH_COOKIE_NAME, SESSION_TTL_MS } from '@/lib/auth';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Brute-force protection: 5 attempts per IP per 15 minutes in production (higher in dev/testing).
    const maxAttempts = process.env.NODE_ENV === 'production' ? 5 : 50;
    const rl = rateLimit(`admin-login:${getClientIp(req)}`, maxAttempts, 15 * 60 * 1000);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = await req.json().catch(() => ({}));
    const { username = '', password = '', pin = '' } = body;

    const identifier = String(username).trim();
    const secret = String(password).trim() || String(pin).trim();

    if (!identifier || !secret) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isValid = validateCredentials(identifier, secret);

    if (!isValid) {
      // Generic message — do not reveal which part was wrong.
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid administrator credentials. Please check your username and password.',
        },
        { status: 401 }
      );
    }

    const token = generateToken(identifier);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        username: identifier,
        role: 'Super Administrator',
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
