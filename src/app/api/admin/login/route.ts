import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, generateToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username = '', password = '', pin = '' } = body;

    const identifier = username.trim() || 'admin';
    const secret = password.trim() || pin.trim();

    if (!secret) {
      return NextResponse.json(
        { success: false, error: 'Password or Security PIN is required' },
        { status: 400 }
      );
    }

    const isValid = validateCredentials(identifier, secret);

    if (!isValid) {
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
