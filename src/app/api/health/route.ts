import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Lightweight health/diagnostic endpoint.
 * Does NOT connect to the database — purely reports env config and build version.
 * Use to verify the cPanel server pulled the latest code.
 */
export async function GET() {
  const BUILD_TAG = '2026-10-16T10:24:00Z'; // Updated each deploy push

  return NextResponse.json({
    status: 'ok',
    buildTag: BUILD_TAG,
    timestamp: new Date().toISOString(),
    node: process.version,
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV || '(not set)',
      DB_HOST: process.env.DB_HOST || '(not set)',
      DB_PORT: process.env.DB_PORT || '(not set)',
      DB_USER: process.env.DB_USER || process.env.DB_USERNAME || '(not set)',
      DB_NAME: process.env.DB_NAME || process.env.DB_DATABASE || '(not set)',
      MYSQL_HOST: process.env.MYSQL_HOST || '(not set)',
      DATABASE_URL: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:([^@:]+)@/, ':***@')
        : '(not set)',
      hasPassword: Boolean(
        process.env.DB_PASSWORD || process.env.DB_PASS ||
        process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS
      ),
    },
  });
}
