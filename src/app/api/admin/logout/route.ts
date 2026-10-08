import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out successfully',
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
