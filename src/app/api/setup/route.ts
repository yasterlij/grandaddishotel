import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { isMysql } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_URL environment variable is not configured on the server.',
      },
      { status: 500 }
    );
  }

  const sqlFile = path.join(process.cwd(), 'scripts', 'grand_addis_mysql.sql');
  if (!fs.existsSync(sqlFile)) {
    return NextResponse.json(
      { success: false, error: 'Migration dump file not found on disk at ' + sqlFile },
      { status: 500 }
    );
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  // Strip CREATE DATABASE / USE statements so it imports into the active Plesk database
  const sanitizedSql = sqlContent
    .replace(/CREATE DATABASE[^\n;]+;/gi, '')
    .replace(/USE `?[a-zA-Z0-9_]+`?;/gi, '');

  let connection;
  try {
    connection = await mysql.createConnection({
      uri: connectionString,
      multipleStatements: true,
    });

    await connection.query(sanitizedSql);

    // Verify created tables
    const [rows] = await connection.query('SHOW TABLES');

    return NextResponse.json({
      success: true,
      message: '✓ Grand Addis Hotel MySQL schema and seed data installed successfully!',
      databaseUrl: connectionString.replace(/:[^:@]+@/, ':****@'),
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
      },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
