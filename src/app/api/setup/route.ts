import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { getMysqlConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BUILD_TAG = '2026-10-16T10:24:00Z';

function getRawEnvDiag() {
  return {
    buildTag: BUILD_TAG,
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
    cwd: process.cwd(),
    node: process.version,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (key !== 'GrandAddis2026!') {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid or missing setup key. Append ?key=GrandAddis2026! to authorize setup.',
      },
      { status: 401 }
    );
  }

  // Step 1: Resolve MySQL config (may throw if env vars are missing)
  let connConfig: any = null;
  try {
    connConfig = getMysqlConfig();
  } catch (configError: any) {
    console.error('Setup: getMysqlConfig() failed:', configError);
    return NextResponse.json(
      {
        success: false,
        error: `Config resolution failed: ${configError.message}`,
        rawEnv: getRawEnvDiag(),
        resolvedConfig: null,
      },
      { status: 500 }
    );
  }

  // Step 2: Locate SQL dump
  const sqlFile = path.join(process.cwd(), 'scripts', 'grand_addis_mysql.sql');
  if (!fs.existsSync(sqlFile)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Migration dump file not found on disk at ' + sqlFile,
        rawEnv: getRawEnvDiag(),
        resolvedConfig: {
          host: connConfig.host,
          port: connConfig.port,
          user: connConfig.user,
          database: connConfig.database,
        },
      },
      { status: 500 }
    );
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  // Strip CREATE DATABASE / USE statements so it imports into the active database
  const sanitizedSql = sqlContent
    .replace(/CREATE DATABASE[^\n;]+;/gi, '')
    .replace(/USE `?[a-zA-Z0-9_]+`?;/gi, '');

  let connection;
  try {
    connection = await mysql.createConnection(connConfig);

    await connection.query(sanitizedSql);

    // Verify created tables
    const [rows] = await connection.query('SHOW TABLES');

    return NextResponse.json({
      success: true,
      buildTag: BUILD_TAG,
      message: '✓ Grand Addis Hotel MySQL schema and seed data installed successfully!',
      target: `${connConfig.user}@${connConfig.host}:${connConfig.port}/${connConfig.database}`,
      tablesCount: Array.isArray(rows) ? rows.length : 0,
      adminLoginUrl: '/admin',
      credentials: {
        username: 'admin',
        password: 'GrandAddis2026!',
      },
    });
  } catch (error: any) {
    console.error('Setup endpoint migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to execute MySQL seed dump',
        rawEnv: getRawEnvDiag(),
        resolvedConfig: {
          host: connConfig.host,
          port: connConfig.port,
          user: connConfig.user,
          database: connConfig.database,
          hasPassword: Boolean(connConfig.password),
        },
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
