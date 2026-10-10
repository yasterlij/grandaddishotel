import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Automatically load environment files in priority order
for (const envFile of ['.env.production', '.env.local', '.env']) {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function getMysqlConnectionConfig() {
  const dbUser =
    process.env.DB_USER ||
    process.env.DB_USERNAME ||
    process.env.MYSQL_USER ||
    process.env.MYSQL_USERNAME;

  const dbPassword =
    process.env.DB_PASSWORD ||
    process.env.DB_PASS ||
    process.env.MYSQL_PASSWORD ||
    process.env.MYSQL_PASS;

  const dbHost =
    process.env.DB_HOST ||
    process.env.MYSQL_HOST;

  const dbPort = parseInt(
    process.env.DB_PORT || process.env.MYSQL_PORT || '3306',
    10
  );

  const dbName =
    process.env.DB_NAME ||
    process.env.DB_DATABASE ||
    process.env.MYSQL_DATABASE ||
    process.env.MYSQL_DB;

  const rawUrl =
    process.env.MYSQL_URL ||
    process.env.MYSQL_DATABASE_URL ||
    (process.env.DATABASE_URL?.startsWith('mysql') ? process.env.DATABASE_URL : null);

  if (process.env.DATABASE_URL?.startsWith('postgres')) {
    console.log('ℹ️ Note: DATABASE_URL is set to PostgreSQL. Checking MySQL-specific credentials for seeding...');
  }

  let parsedFromUrl = {};
  if (rawUrl) {
    try {
      const ConnectionConfig = mysql.ConnectionConfig;
      if (ConnectionConfig && typeof ConnectionConfig.parseUrl === 'function') {
        parsedFromUrl = ConnectionConfig.parseUrl(rawUrl) || {};
      }
    } catch {
      const match = rawUrl.match(/^mysql:\/\/(?:([^:]+)(?::([^@]*))?@)?([^:/]+)(?::(\d+))?\/(.+)$/);
      if (match) {
        parsedFromUrl = {
          user: match[1] ? decodeURIComponent(match[1]) : undefined,
          password: match[2] ? decodeURIComponent(match[2]) : undefined,
          host: match[3],
          port: match[4] ? parseInt(match[4], 10) : undefined,
          database: match[5]?.split('?')[0],
        };
      }
    }
  }

  const finalUser = dbUser || parsedFromUrl.user;
  const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;
  const finalHost = dbHost || parsedFromUrl.host;
  const finalPort = dbPort || parsedFromUrl.port || 3306;
  const finalDatabase = dbName || parsedFromUrl.database;

  if (!finalHost || !finalUser || finalPassword === undefined || !finalDatabase) {
    throw new Error(
      'MySQL production credentials are not fully configured. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, or provide a full mysql:// DATABASE_URL / MYSQL_URL.'
    );
  }

  return {
    host: finalHost,
    port: finalPort,
    user: finalUser,
    password: finalPassword,
    database: finalDatabase,
    multipleStatements: true,
  };
}

async function seedMysql() {
  const connConfig = getMysqlConnectionConfig();

  console.log(`\nConnecting to MySQL at: ${connConfig.user}@${connConfig.host}:${connConfig.port}/${connConfig.database}`);
  console.log(`Password provided: ${connConfig.password ? 'YES (' + connConfig.password.length + ' chars)' : 'NO'}`);

  const sqlFile = path.join(__dirname, 'grand_addis_mysql.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');

  // Strip CREATE DATABASE / USE statements if connecting to a specific DB in Plesk
  const sanitizedSql = sqlContent
    .replace(/CREATE DATABASE[^\n;]+;/gi, '')
    .replace(/USE `?[a-zA-Z0-9_]+`?;/gi, '');

  let connection;
  try {
    connection = await mysql.createConnection(connConfig);

    console.log('✓ Successfully authenticated to MySQL!');
    console.log('Executing MySQL DDL and Seed Data from grand_addis_mysql.sql...');
    await connection.query(sanitizedSql);
    console.log('✓ MySQL database schema and production data seeded successfully!\n');
  } catch (error) {
    console.error('\n✗ Failed to seed MySQL database:', error.message || error);

    if (error.code === 'ER_ACCESS_DENIED_ERROR' || (error.message && error.message.includes('Access denied'))) {
      console.error('\n' + '='.repeat(60));
      console.error('🔑 AUTHENTICATION ERROR (Access Denied)');
      console.error('='.repeat(60));
      console.error(`User '${connConfig.user}' was rejected by MySQL on ${connConfig.host}:${connConfig.port}.`);
      console.error('\nPlease verify your credentials in .env, .env.production, or Plesk Environment Variables:');
      console.error(`  DB_USER=${connConfig.user || 'your_db_username'}`);
      console.error('  DB_PASSWORD=your_actual_db_password');
      console.error(`  DB_HOST=${connConfig.host}`);
      console.error(`  DB_PORT=${connConfig.port}`);
      console.error(`  DB_NAME=${connConfig.database}`);
      console.error('\nOr supply as a MySQL URL:');
      console.error(`  DATABASE_URL="mysql://${connConfig.user}:your_password@${connConfig.host}:${connConfig.port}/${connConfig.database}"`);
      console.error('='.repeat(60) + '\n');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

seedMysql();
