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
  try {
    const withoutScheme = rawUrl.replace(/^mysql:\/\//i, '');
    const slashIdx = withoutScheme.indexOf('/');
    const pathAndQuery = slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : '';
    const database = pathAndQuery.split('?')[0];

    const hostAndAuth = slashIdx !== -1 ? withoutScheme.slice(0, slashIdx) : withoutScheme;
    const lastAtIdx = hostAndAuth.lastIndexOf('@');

    let user, password, host, port;

    if (lastAtIdx !== -1) {
      const auth = hostAndAuth.slice(0, lastAtIdx);
      const hostPart = hostAndAuth.slice(lastAtIdx + 1);

      const firstColonIdx = auth.indexOf(':');
      if (firstColonIdx !== -1) {
        user = decodeURIComponent(auth.slice(0, firstColonIdx));
        password = decodeURIComponent(auth.slice(firstColonIdx + 1));
      } else {
        user = decodeURIComponent(auth);
      }

      const hostColonIdx = hostPart.lastIndexOf(':');
      if (hostColonIdx !== -1) {
        host = hostPart.slice(0, hostColonIdx);
        port = parseInt(hostPart.slice(hostColonIdx + 1), 10);
      } else {
        host = hostPart;
      }
    } else {
      const hostColonIdx = hostAndAuth.lastIndexOf(':');
      if (hostColonIdx !== -1) {
        host = hostAndAuth.slice(0, hostColonIdx);
        port = parseInt(hostAndAuth.slice(hostColonIdx + 1), 10);
      } else {
        host = hostAndAuth;
      }
    }

    if (host && host.includes('@')) {
      const parts = host.split('@');
      host = parts[parts.length - 1];
    }

    return {
      user,
      password,
      host,
      port: isNaN(port) ? undefined : port,
      database: database ? decodeURIComponent(database) : undefined,
    };
  } catch {
    return {};
  }
}

function sanitizeHostAndPort(rawHost, rawPort) {
  let host = (rawHost || '').trim() || '127.0.0.1';
  let port = typeof rawPort === 'number' ? rawPort : parseInt(String(rawPort || '3306'), 10);
  if (host.includes('@')) {
    const parts = host.split('@');
    host = parts[parts.length - 1].trim();
  }
  if (host.includes(':')) {
    const [h, p] = host.split(':');
    host = h.trim();
    const parsedP = parseInt(p, 10);
    if (!isNaN(parsedP)) port = parsedP;
  }
  if (host.toLowerCase() === 'localhost') host = '127.0.0.1';
  return { host: host || '127.0.0.1', port: isNaN(port) ? 3306 : port };
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

    const { host: finalHost, port: finalPort } = sanitizeHostAndPort(
      dbHost || parsedFromUrl.host,
      !isNaN(dbPort) && process.env.DB_PORT ? dbPort : parsedFromUrl.port || dbPort
    );
    const finalUser = dbUser || parsedFromUrl.user;
    const finalDatabase = dbName || parsedFromUrl.database;
    const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;

    if (!finalHost || !finalUser || finalPassword === undefined || !finalDatabase) {
      console.error('✗ MySQL configuration is incomplete. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, or provide MYSQL_URL / DATABASE_URL.');
      process.exit(1);
    }

    console.log(`Host:     ${finalHost}:${finalPort}`);
    console.log(`User:     ${finalUser}`);
    console.log(`Database: ${finalDatabase}`);
    console.log(`Password: ${finalPassword ? 'YES (' + String(finalPassword).length + ' chars)' : 'NO'}`);
    console.log('------------------------------------------------------------');

    try {
      const conn = await mysql.createConnection({
        host: finalHost,
        port: finalPort,
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
