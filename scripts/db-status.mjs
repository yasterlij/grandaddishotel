import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

for (const envFile of ['.env.production', '.env.local', '.env']) {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

const isMysql = Boolean(
  process.env.DB_HOST ||
  process.env.DB_USER ||
  process.env.DB_USERNAME ||
  process.env.MYSQL_USER ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_DATABASE_URL ||
  connectionString.startsWith('mysql://') ||
  connectionString.startsWith('mysql:')
);

function parseMysqlUrl(rawUrl) {
  const match = rawUrl.match(/^mysql:\/\/(?:([^:]+)(?::([^@]*))?@)?([^:/]+)(?::(\d+))?\/([^?]+)(?:\?.*)?$/i);
  if (match) {
    return {
      user: match[1] ? decodeURIComponent(match[1]) : undefined,
      password: match[2] ? decodeURIComponent(match[2]) : undefined,
      host: match[3],
      port: match[4] ? parseInt(match[4], 10) : undefined,
      database: match[5],
    };
  }
  return {};
}

async function checkStatus() {
  console.log('\n============================================================');
  console.log('GRAND ADDIS HOTEL - DATABASE HEALTH & STATUS CHECK');
  console.log(`Detected Engine: ${isMysql ? 'MySQL / MariaDB' : 'PostgreSQL'}`);
  console.log('============================================================\n');

  const start = Date.now();

  if (isMysql) {
    const dbUser = process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || process.env.MYSQL_USERNAME;
    const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST;
    const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
    const dbName = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE || process.env.MYSQL_DB;
    const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS;
    const rawUrl = process.env.MYSQL_URL || process.env.MYSQL_DATABASE_URL || (connectionString.startsWith('mysql') ? connectionString : null);
    const parsedFromUrl = rawUrl ? parseMysqlUrl(rawUrl) : {};
    const finalHost = dbHost || parsedFromUrl.host;
    const finalUser = dbUser || parsedFromUrl.user;
    const finalDatabase = dbName || parsedFromUrl.database;
    const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;

    if (!finalHost || !finalUser || finalPassword === undefined || !finalDatabase) {
      console.error('✗ MySQL configuration is incomplete. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, or provide MYSQL_URL / DATABASE_URL.');
      process.exit(1);
    }

    console.log(`Host:     ${finalHost}:${dbPort}`);
    console.log(`User:     ${finalUser}`);
    console.log(`Database: ${finalDatabase}`);
    console.log(`Password: ${finalPassword ? 'YES (' + String(finalPassword).length + ' chars)' : 'NO'}`);
    console.log('------------------------------------------------------------');

    try {
      const conn = await mysql.createConnection({
        host: finalHost,
        port: dbPort,
        user: finalUser,
        password: finalPassword,
        database: finalDatabase,
      });

      const latency = Date.now() - start;
      console.log(`✓ Connected in ${latency}ms!\n`);

      const tables = [
        'room_types',
        'rooms',
        'reservations',
        'payments',
        'gallery_images',
        'experiences',
        'dining_menu',
        'spa_treatments',
        'testimonials',
        'hotel_settings',
      ];

      console.log('Table Row Counts:');
      for (const tbl of tables) {
        try {
          const [rows] = await conn.query(`SELECT COUNT(*) as count FROM \`${tbl}\``);
          const count = Array.isArray(rows) && rows[0] ? rows[0].count : 0;
          console.log(`  • \`${tbl.padEnd(16)}\`: ${count} records`);
        } catch {
          console.log(`  • \`${tbl.padEnd(16)}\`: [table not found]`);
        }
      }

      await conn.end();
      console.log('\n✓ Database is healthy and ready for production traffic!\n');
    } catch (err) {
      console.error('✗ Connection failed:', err.message || err);
      process.exit(1);
    }
  } else {
    console.log(`Connection URL: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
    console.log('------------------------------------------------------------');

    try {
      const pool = new Pool({ connectionString });
      const res = await pool.query('SELECT NOW() as current_time');
      const latency = Date.now() - start;
      console.log(`✓ Connected in ${latency}ms! DB Time: ${res.rows[0].current_time}\n`);

      const tables = [
        'room_types',
        'rooms',
        'reservations',
        'payments',
        'gallery_images',
        'experiences',
        'dining_menu',
        'spa_treatments',
        'testimonials',
        'hotel_settings',
      ];

      console.log('Table Row Counts:');
      for (const tbl of tables) {
        try {
          const r = await pool.query(`SELECT COUNT(*) as count FROM ${tbl}`);
          console.log(`  • ${tbl.padEnd(16)}: ${r.rows[0].count} records`);
        } catch {
          console.log(`  • ${tbl.padEnd(16)}: [table not found]`);
        }
      }

      await pool.end();
      console.log('\n✓ Database is healthy and ready!\n');
    } catch (err) {
      console.error('✗ Connection failed:', err.message || err);
      process.exit(1);
    }
  }
}

checkStatus();
