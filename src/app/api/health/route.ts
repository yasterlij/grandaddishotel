import { NextResponse } from 'next/server';
import { isMysql, pgPool, mysqlPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BUILD_TAG = '2026-10-16T11:00:00Z';

/**
 * Health / Diagnostic endpoint:
 * Reports environment configuration, active database engine (PostgreSQL or MySQL),
 * and tests a lightweight ping query with a timeout.
 */
export async function GET() {
  const dbEngine = isMysql ? 'mysql' : 'postgresql';
  let dbStatus: { connected: boolean; latencyMs?: number; error?: string } = {
    connected: false,
  };

  const start = Date.now();
  try {
    if (isMysql) {
      if (mysqlPool) {
        await Promise.race([
          mysqlPool.query('SELECT 1 AS ping'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('MySQL ping timeout after 3000ms')), 3000)
          ),
        ]);
        dbStatus = { connected: true, latencyMs: Date.now() - start };
      } else {
        dbStatus = { connected: false, error: 'mysqlPool not initialized' };
      }
    } else {
      if (pgPool) {
        await Promise.race([
          pgPool.query('SELECT 1 AS ping'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PostgreSQL ping timeout after 3000ms')), 3000)
          ),
        ]);
        dbStatus = { connected: true, latencyMs: Date.now() - start };
      } else {
        dbStatus = { connected: false, error: 'pgPool not initialized' };
      }
    }
  } catch (err: any) {
    dbStatus = {
      connected: false,
      error: err.message || String(err),
      latencyMs: Date.now() - start,
    };
  }

  return NextResponse.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    buildTag: BUILD_TAG,
    dbEngine,
    dbStatus,
    timestamp: new Date().toISOString(),
    node: process.version,
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV || '(not set)',
      DB_TYPE: process.env.DB_TYPE || '(auto-detected)',
      DB_HOST: process.env.DB_HOST || '(not set)',
      DB_PORT: process.env.DB_PORT || '(not set)',
      DB_USER: process.env.DB_USER || process.env.DB_USERNAME || '(not set)',
      DB_NAME: process.env.DB_NAME || process.env.DB_DATABASE || '(not set)',
      PGHOST: process.env.PGHOST || '(not set)',
      PGPORT: process.env.PGPORT || '(not set)',
      PGUSER: process.env.PGUSER || '(not set)',
      PGDATABASE: process.env.PGDATABASE || '(not set)',
      MYSQL_HOST: process.env.MYSQL_HOST || '(not set)',
      DATABASE_URL: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:([^@:]+)@/, ':***@')
        : '(not set)',
    },
  });
}

