import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment in priority order across candidate directories
if (typeof process !== 'undefined' && process.env) {
  let projectRoot = process.cwd ? process.cwd() : '.';
  const candidates = [
    projectRoot,
    process.env.PWD,
    typeof __dirname !== 'undefined' ? __dirname : '',
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..') : '',
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../..') : '',
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'package.json')) || fs.existsSync(path.join(dir, '.env'))) {
      projectRoot = dir;
      break;
    }
  }

  for (const envFile of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const envPath = path.resolve(projectRoot, envFile);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }
}

import { Pool } from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import mysql from 'mysql2/promise';
import type { Pool as MysqlPool, PoolConnection } from 'mysql2/promise';
import { GALLERY_IMAGES, EXPERIENCES } from '@/data/hotelData';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

export const isMysql = Boolean(
  process.env.DB_HOST ||
  process.env.DB_USER ||
  process.env.DB_USERNAME ||
  process.env.MYSQL_USER ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_DATABASE_URL ||
  connectionString.startsWith('mysql://') ||
  connectionString.startsWith('mysql:')
);

function parseMysqlUrl(rawUrl: string): {
  user?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
} {
  try {
    const withoutScheme = rawUrl.replace(/^mysql:\/\//i, '');
    const slashIdx = withoutScheme.indexOf('/');
    const pathAndQuery = slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : '';
    const database = pathAndQuery.split('?')[0];

    const hostAndAuth = slashIdx !== -1 ? withoutScheme.slice(0, slashIdx) : withoutScheme;
    const lastAtIdx = hostAndAuth.lastIndexOf('@');

    let user: string | undefined;
    let password: string | undefined;
    let host: string | undefined;
    let port: number | undefined;

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

    if (host) {
      const sanitized = sanitizeHostAndPort(host, port);
      host = sanitized.host;
      port = sanitized.port;
    }

    return {
      user,
      password,
      host,
      port,
      database: database ? decodeURIComponent(database) : undefined,
    };
  } catch {
    return {};
  }
}

export function sanitizeHostAndPort(
  rawHost?: string,
  rawPort?: number | string
): { host: string; port: number } {
  let host = (rawHost || '').trim() || '127.0.0.1';
  let port = typeof rawPort === 'number' ? rawPort : parseInt(String(rawPort || '3306'), 10);

  // 1. If host contains '@' (e.g. "9223@localhost" or "user@host"), extract the host portion after the last '@'
  if (host.includes('@')) {
    const parts = host.split('@');
    host = parts[parts.length - 1].trim();
  }

  // 2. If host contains ':' (e.g. "localhost:3306" or "127.0.0.1:3306")
  if (host.includes(':')) {
    const [h, p] = host.split(':');
    host = h.trim();
    const parsedP = parseInt(p, 10);
    if (!isNaN(parsedP)) {
      port = parsedP;
    }
  }

  // 3. Normalize 'localhost' to IPv4 loopback '127.0.0.1' to avoid DNS getaddrinfo and IPv6 ::1 connection issues
  if (host.toLowerCase() === 'localhost') {
    host = '127.0.0.1';
  }

  return { host: host || '127.0.0.1', port: isNaN(port) ? 3306 : port };
}

export function getMysqlConfig(): {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  timezone: string;
  dateStrings: boolean;
  multipleStatements: boolean;
  connectTimeout?: number;
  charset?: string;
} {
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
    (connectionString.startsWith('mysql') ? connectionString : null);

  const parsedFromUrl = rawUrl ? parseMysqlUrl(rawUrl) : {};

  // Sanitize host and port, stripping any lingering '@' or non-standard prefix
  const { host: finalHost, port: finalPort } = sanitizeHostAndPort(
    dbHost || parsedFromUrl.host,
    !isNaN(dbPort) && process.env.DB_PORT ? dbPort : parsedFromUrl.port || dbPort
  );

  const finalUser = dbUser || parsedFromUrl.user;
  const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;
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
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    charset: 'utf8mb4',
    timezone: '+00:00',
    dateStrings: true,
    multipleStatements: true,
  };
}

// Ensure single pool instance across Next.js reloads
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _mysqlPool: MysqlPool | undefined;
  // eslint-disable-next-line no-var
  var _dbInitPromise: Promise<void> | undefined;
}

export let pgPool: Pool;
export let mysqlPool: MysqlPool;

if (isMysql) {
  if (!global._mysqlPool) {
    const mysqlConfig = getMysqlConfig();
    global._mysqlPool = mysql.createPool(mysqlConfig);
  }
  mysqlPool = global._mysqlPool;
} else {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pgPool = global._pgPool;
}

// Module-level reference to the shared init promise
let initPromise: Promise<void> | null = global._dbInitPromise ?? null;

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (isMysql) {
        // Ensure hotel_settings exists
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`hotel_settings\` (
            \`key\` VARCHAR(191) PRIMARY KEY,
            \`value\` TEXT NOT NULL,
            \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);
        await mysqlPool.query(`
          INSERT INTO \`hotel_settings\` (\`key\`, \`value\`) VALUES ('usd_to_etb_rate', '189')
          ON DUPLICATE KEY UPDATE \`value\` = \`value\`;
        `);

        // Ensure gallery_images exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`gallery_images\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`src\` TEXT NOT NULL,
            \`title\` VARCHAR(255) NOT NULL,
            \`category\` VARCHAR(100) NOT NULL DEFAULT 'hotel',
            \`sort_order\` INT NOT NULL DEFAULT 0,
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure room_types exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`room_types\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`slug\` VARCHAR(191) NOT NULL UNIQUE,
            \`name\` VARCHAR(255) NOT NULL,
            \`description\` TEXT NOT NULL,
            \`baseCapacity\` INT NOT NULL DEFAULT 2,
            \`maxCapacity\` INT NOT NULL DEFAULT 3,
            \`amenities\` JSON DEFAULT NULL,
            \`images\` JSON DEFAULT NULL,
            \`basePriceETB\` DECIMAL(10,2) NOT NULL DEFAULT 5800.00,
            \`basePriceUSD\` DECIMAL(10,2) NOT NULL DEFAULT 50.00,
            \`size\` VARCHAR(50) DEFAULT '32 m²',
            \`bedType\` VARCHAR(100) DEFAULT 'King Bed',
            \`view\` VARCHAR(100) DEFAULT 'City View',
            \`category\` VARCHAR(100) DEFAULT 'Hotel Rooms',
            \`featured\` TINYINT(1) DEFAULT 1,
            \`aliases\` JSON DEFAULT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure rooms exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`rooms\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`roomNumber\` VARCHAR(50) NOT NULL UNIQUE,
            \`floor\` INT NOT NULL DEFAULT 1,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
            \`roomTypeId\` VARCHAR(191) NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure guests exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`guests\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`firstName\` VARCHAR(100) NOT NULL,
            \`lastName\` VARCHAR(100) NOT NULL,
            \`email\` VARCHAR(191) NOT NULL UNIQUE,
            \`phoneNumber\` VARCHAR(100) NOT NULL,
            \`nationalIdOrPass\` VARCHAR(100) DEFAULT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure reservations exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`reservations\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`bookingRef\` VARCHAR(100) NOT NULL UNIQUE,
            \`checkInDate\` DATE NOT NULL,
            \`checkOutDate\` DATE NOT NULL,
            \`adultsCount\` INT NOT NULL DEFAULT 1,
            \`childrenCount\` INT NOT NULL DEFAULT 0,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
            \`expiresAt\` DATETIME(3) DEFAULT NULL,
            \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
            \`subtotal\` DECIMAL(10,2) NOT NULL,
            \`taxAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            \`totalAmount\` DECIMAL(10,2) NOT NULL,
            \`specialRequests\` TEXT DEFAULT NULL,
            \`guestId\` VARCHAR(191) NOT NULL,
            \`roomTypeId\` VARCHAR(191) NOT NULL,
            \`roomId\` VARCHAR(191) DEFAULT NULL,
            \`isDateExtended\` TINYINT(1) DEFAULT 0,
            \`dateChangeNote\` TEXT DEFAULT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure payments exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`payments\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`amount\` DECIMAL(10,2) NOT NULL,
            \`currency\` VARCHAR(10) NOT NULL DEFAULT 'USD',
            \`provider\` VARCHAR(50) NOT NULL DEFAULT 'CASH_ON_ARRIVAL',
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
            \`txRef\` VARCHAR(191) NOT NULL UNIQUE,
            \`gatewayRef\` VARCHAR(191) DEFAULT NULL,
            \`rawPayload\` JSON DEFAULT NULL,
            \`reservationId\` VARCHAR(191) NOT NULL,
            \`paidAt\` DATETIME(3) DEFAULT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure table_reservations exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`table_reservations\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`date\` DATE NOT NULL,
            \`time\` VARCHAR(50) NOT NULL,
            \`party_size\` INT NOT NULL,
            \`guest_name\` VARCHAR(255) NOT NULL,
            \`guest_phone\` VARCHAR(100) NOT NULL,
            \`guest_email\` VARCHAR(191) NOT NULL,
            \`notes\` TEXT DEFAULT NULL,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure spa_appointments exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`spa_appointments\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`service_id\` VARCHAR(191) NOT NULL,
            \`service_name\` VARCHAR(255) NOT NULL,
            \`date\` DATE NOT NULL,
            \`time\` VARCHAR(50) NOT NULL,
            \`client_name\` VARCHAR(255) NOT NULL,
            \`client_phone\` VARCHAR(100) NOT NULL,
            \`client_email\` VARCHAR(191) NOT NULL,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure contact_messages exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`contact_messages\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`name\` VARCHAR(255) NOT NULL,
            \`email\` VARCHAR(191) NOT NULL,
            \`phone\` VARCHAR(100) DEFAULT NULL,
            \`subject\` VARCHAR(255) NOT NULL,
            \`message\` TEXT NOT NULL,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'NEW',
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure event_inquiries exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`event_inquiries\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`event_type\` VARCHAR(100) NOT NULL,
            \`target_date\` DATE NOT NULL,
            \`guests_count\` VARCHAR(50) NOT NULL,
            \`name\` VARCHAR(255) NOT NULL,
            \`email\` VARCHAR(191) NOT NULL,
            \`phone\` VARCHAR(100) NOT NULL,
            \`details\` TEXT DEFAULT NULL,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'NEW',
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure testimonials exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`testimonials\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`name\` VARCHAR(255) NOT NULL,
            \`location\` VARCHAR(100) NOT NULL,
            \`rating\` INT NOT NULL DEFAULT 5,
            \`date\` VARCHAR(50) NOT NULL,
            \`title\` VARCHAR(255) NOT NULL,
            \`comment\` TEXT NOT NULL,
            \`room_type\` VARCHAR(100) NOT NULL,
            \`status\` VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure dining_menu exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`dining_menu\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`name\` VARCHAR(255) NOT NULL,
            \`category\` VARCHAR(100) NOT NULL,
            \`price\` DECIMAL(10,2) NOT NULL,
            \`description\` TEXT NOT NULL,
            \`tag\` VARCHAR(50) DEFAULT NULL,
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure spa_treatments exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`spa_treatments\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`name\` VARCHAR(255) NOT NULL,
            \`category\` VARCHAR(100) NOT NULL,
            \`duration\` VARCHAR(50) NOT NULL,
            \`price\` DECIMAL(10,2) NOT NULL,
            \`description\` TEXT NOT NULL,
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure experiences exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`experiences\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`title\` VARCHAR(255) NOT NULL,
            \`subtitle\` VARCHAR(255) NOT NULL,
            \`category\` VARCHAR(100) NOT NULL,
            \`duration\` VARCHAR(50) NOT NULL,
            \`image\` TEXT NOT NULL,
            \`description\` TEXT NOT NULL,
            \`highlights\` JSON DEFAULT NULL,
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure promotions exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`promotions\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`title\` VARCHAR(255) NOT NULL,
            \`badge\` VARCHAR(100) NOT NULL,
            \`discount\` VARCHAR(100) NOT NULL,
            \`description\` TEXT NOT NULL,
            \`inclusions\` JSON DEFAULT NULL,
            \`code\` VARCHAR(100) NOT NULL,
            \`valid_until\` VARCHAR(100) NOT NULL,
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure faqs exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS \`faqs\` (
            \`id\` VARCHAR(191) PRIMARY KEY,
            \`question\` TEXT NOT NULL,
            \`answer\` TEXT NOT NULL,
            \`category\` VARCHAR(100) NOT NULL,
            \`sort_order\` INT DEFAULT 0,
            \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
          );
        `);

        // Safe column additions and migrations for pre-existing MySQL tables
        const mysqlMigrations = [
          "ALTER TABLE \`room_types\` ADD COLUMN \`size\` VARCHAR(50) DEFAULT '32 m²'",
          "ALTER TABLE \`room_types\` ADD COLUMN \`bedType\` VARCHAR(100) DEFAULT 'King Bed'",
          "ALTER TABLE \`room_types\` ADD COLUMN \`view\` VARCHAR(100) DEFAULT 'City View'",
          "ALTER TABLE \`room_types\` ADD COLUMN \`category\` VARCHAR(100) DEFAULT 'Hotel Rooms'",
          "ALTER TABLE \`room_types\` ADD COLUMN \`featured\` TINYINT(1) DEFAULT 1",
          "ALTER TABLE \`room_types\` ADD COLUMN \`aliases\` JSON DEFAULT NULL",

          "ALTER TABLE \`reservations\` ADD COLUMN \`adultsCount\` INT NOT NULL DEFAULT 1",
          "ALTER TABLE \`reservations\` ADD COLUMN \`childrenCount\` INT NOT NULL DEFAULT 0",
          "ALTER TABLE \`reservations\` ADD COLUMN \`expiresAt\` DATETIME(3) DEFAULT NULL",
          "ALTER TABLE \`reservations\` ADD COLUMN \`subtotal\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
          "ALTER TABLE \`reservations\` ADD COLUMN \`taxAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
          "ALTER TABLE \`reservations\` ADD COLUMN \`totalAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
          "ALTER TABLE \`reservations\` ADD COLUMN \`roomId\` VARCHAR(191) DEFAULT NULL",
          "ALTER TABLE \`reservations\` ADD COLUMN \`isDateExtended\` TINYINT(1) DEFAULT 0",
          "ALTER TABLE \`reservations\` ADD COLUMN \`dateChangeNote\` TEXT DEFAULT NULL",

          "ALTER TABLE \`payments\` ADD COLUMN \`reservationId\` VARCHAR(191) DEFAULT NULL",
          "ALTER TABLE \`payments\` ADD COLUMN \`paidAt\` DATETIME(3) DEFAULT NULL",
          "ALTER TABLE \`payments\` ADD COLUMN \`rawPayload\` JSON DEFAULT NULL",

          "ALTER TABLE \`promotions\` ADD COLUMN \`badge\` VARCHAR(100) NOT NULL DEFAULT 'Offer'",
          "ALTER TABLE \`promotions\` ADD COLUMN \`discount\` VARCHAR(100) NOT NULL DEFAULT '10% Off'",
          "ALTER TABLE \`promotions\` ADD COLUMN \`inclusions\` JSON DEFAULT NULL",
          "ALTER TABLE \`promotions\` ADD COLUMN \`code\` VARCHAR(100) NOT NULL DEFAULT 'PROMO'",
          "ALTER TABLE \`promotions\` MODIFY COLUMN \`valid_until\` VARCHAR(100) NOT NULL DEFAULT 'Ongoing'",

          "ALTER TABLE \`dining_menu\` ADD COLUMN \`price\` DECIMAL(10,2) NOT NULL DEFAULT 25.00",
          "ALTER TABLE \`dining_menu\` ADD COLUMN \`tag\` VARCHAR(50) DEFAULT NULL",

          "ALTER TABLE \`spa_treatments\` ADD COLUMN \`price\` DECIMAL(10,2) NOT NULL DEFAULT 50.00",

          "ALTER TABLE \`table_reservations\` ADD COLUMN \`party_size\` INT NOT NULL DEFAULT 2",
          "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_name\` VARCHAR(255) DEFAULT NULL",
          "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_phone\` VARCHAR(100) DEFAULT NULL",
          "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_email\` VARCHAR(191) DEFAULT NULL",
          "ALTER TABLE \`table_reservations\` ADD COLUMN \`notes\` TEXT DEFAULT NULL",

          "ALTER TABLE \`spa_appointments\` ADD COLUMN \`service_id\` VARCHAR(191) DEFAULT NULL",
          "ALTER TABLE \`spa_appointments\` ADD COLUMN \`service_name\` VARCHAR(255) DEFAULT 'Spa Treatment'",
          "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_name\` VARCHAR(255) DEFAULT NULL",
          "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_phone\` VARCHAR(100) DEFAULT NULL",
          "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_email\` VARCHAR(191) DEFAULT NULL",

          "ALTER TABLE \`event_inquiries\` ADD COLUMN \`target_date\` DATE DEFAULT NULL",
          "ALTER TABLE \`event_inquiries\` ADD COLUMN \`guests_count\` VARCHAR(50) NOT NULL DEFAULT '50'",
          "ALTER TABLE \`event_inquiries\` ADD COLUMN \`details\` TEXT DEFAULT NULL",

          "ALTER TABLE \`experiences\` ADD COLUMN \`subtitle\` VARCHAR(255) DEFAULT NULL",

          "ALTER TABLE \`gallery_images\` ADD COLUMN \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)",

          "ALTER TABLE \`hotel_settings\` MODIFY COLUMN \`value\` LONGTEXT NOT NULL",
        ];
        for (const migrationSql of mysqlMigrations) {
          try {
            await mysqlPool.query(migrationSql);
          } catch {
            // Column already exists or already migrated, safely ignore
          }
        }
      } else {
        // PostgreSQL DDL bootstrap
        await pgPool.query(`
          ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "size" TEXT DEFAULT '32 m²';
          ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "bedType" TEXT DEFAULT 'King Bed';
          ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "view" TEXT DEFAULT 'City View';
          ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'Hotel Rooms';
          ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT true;
          ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "aliases" TEXT[] DEFAULT '{}';
          ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "isDateExtended" BOOLEAN DEFAULT false;
          ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "dateChangeNote" TEXT;
        `);

        await pgPool.query(`
          CREATE TABLE IF NOT EXISTS table_reservations (
            id TEXT PRIMARY KEY,
            date DATE NOT NULL,
            time TEXT NOT NULL,
            party_size INTEGER NOT NULL,
            guest_name TEXT NOT NULL,
            guest_phone TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'CONFIRMED',
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS spa_appointments (
            id TEXT PRIMARY KEY,
            service_id TEXT NOT NULL,
            service_name TEXT NOT NULL,
            date DATE NOT NULL,
            time TEXT NOT NULL,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            client_email TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONFIRMED',
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS contact_messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'NEW',
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS event_inquiries (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            target_date DATE NOT NULL,
            guests_count TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            details TEXT,
            status TEXT NOT NULL DEFAULT 'NEW',
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS testimonials (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            rating INTEGER NOT NULL DEFAULT 5,
            date TEXT NOT NULL,
            title TEXT NOT NULL,
            comment TEXT NOT NULL,
            room_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'APPROVED',
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS dining_menu (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price NUMERIC(10,2) NOT NULL,
            description TEXT NOT NULL,
            tag TEXT,
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS spa_treatments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            duration TEXT NOT NULL,
            price NUMERIC(10,2) NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS experiences (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            category TEXT NOT NULL,
            duration TEXT NOT NULL,
            image TEXT NOT NULL,
            description TEXT NOT NULL,
            highlights TEXT[] NOT NULL,
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS promotions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            badge TEXT NOT NULL,
            discount TEXT NOT NULL,
            description TEXT NOT NULL,
            inclusions TEXT[] NOT NULL,
            code TEXT NOT NULL,
            valid_until TEXT NOT NULL,
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS faqs (
            id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            category TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hotel_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          INSERT INTO hotel_settings (key, value)
          VALUES ('usd_to_etb_rate', '189')
          ON CONFLICT (key) DO NOTHING;

          CREATE INDEX IF NOT EXISTS idx_room_types_slug ON room_types (slug);
          CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials (status, created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs (sort_order ASC, id ASC);
          CREATE INDEX IF NOT EXISTS idx_table_res_date ON table_reservations (date);
          CREATE INDEX IF NOT EXISTS idx_spa_app_date ON spa_appointments (date);
          CREATE INDEX IF NOT EXISTS idx_dining_menu_cat ON dining_menu (category);
          CREATE INDEX IF NOT EXISTS idx_reservations_roomtype_status_dates ON reservations ("roomTypeId", status, "checkInDate", "checkOutDate");

          CREATE TABLE IF NOT EXISTS gallery_images (
            id TEXT PRIMARY KEY,
            src TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'hotel',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_gallery_images_sort ON gallery_images (sort_order ASC, created_at ASC);
        `);
      }

      // Auto-seed default content, gallery images, and experiences if empty
      await autoSeedDefaultsIfEmpty();
    } catch (err) {
      console.error('Database initialization error:', err);
      initPromise = null;
      global._dbInitPromise = undefined;
      throw err;
    }
  })();

  global._dbInitPromise = initPromise;
  return initPromise;
}

/** Translates PostgreSQL-flavored SQL to MySQL dialect when running on MySQL */
function translateQueryForMysql(sql: string, params?: any[]): { sql: string; params: any[] } {
  let translated = sql;

  // Replace PostgreSQL type casts: ::date, ::int, ::"PaymentStatus", ::"ReservationStatus", ::text
  translated = translated.replace(/::(?:"[a-zA-Z0-9_]+"|[a-zA-Z0-9_\[\]]+)/g, '');

  // Replace gen_random_uuid() with UUID()
  translated = translated.replace(/gen_random_uuid\(\)/gi, 'UUID()');

  // Replace PostgreSQL TO_CHAR(...) with MySQL DATE_FORMAT(...)
  translated = translated.replace(
    /TO_CHAR\(([^,]+),\s*['"]YYYY-MM-DD['"]\)/gi,
    "DATE_FORMAT($1, '%Y-%m-%d')"
  );

  // Replace ON CONFLICT (...) DO UPDATE with ON DUPLICATE KEY UPDATE
  translated = translated.replace(
    /ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET\s+([a-zA-Z0-9_"]+)\s*=\s*EXCLUDED\.\1/gi,
    'ON DUPLICATE KEY UPDATE $1 = VALUES($1)'
  );

  translated = translated.replace(
    /ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET\s+([^\n;]+)/gi,
    (_match: string, setClause: string) => {
      const mysqlSet = setClause.replace(/EXCLUDED\.("?[a-zA-Z0-9_]+")/g, 'VALUES($1)');
      return `ON DUPLICATE KEY UPDATE ${mysqlSet}`;
    }
  );

  // Remove PostgreSQL RETURNING clause
  translated = translated.replace(/\s+RETURNING\s+["a-zA-Z0-9_,\s]+/gi, '');

  // Remove SKIP LOCKED for MariaDB compatibility
  translated = translated.replace(/\s+SKIP\s+LOCKED/gi, '');

  // Convert $1, $2, $3 to ?
  translated = translated.replace(/\$\d+/g, '?');

  // Convert double-quoted PostgreSQL identifiers "columnName" to MySQL backticks `columnName`
  translated = translated.replace(/"([a-zA-Z0-9_]+)"/g, '`$1`');

  // Normalize parameter types for MySQL (undefined to null, arrays/objects to JSON strings)
  const mysqlParams = (params || []).map((p: any) => {
    if (p === undefined) {
      return null;
    }
    if (Array.isArray(p)) {
      return JSON.stringify(p);
    }
    if (p !== null && typeof p === 'object' && !(p instanceof Date)) {
      return JSON.stringify(p);
    }
    return p;
  });

  return { sql: translated, params: mysqlParams };
}

export async function rawQuery<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (isMysql) {
    const { sql, params: mysqlParams } = translateQueryForMysql(text, params);
    const [result] = await mysqlPool.query(sql, mysqlParams);
    const rows = Array.isArray(result) ? (result as T[]) : [];
    return {
      rows,
      rowCount: Array.isArray(result) ? rows.length : (result as any).affectedRows || 0,
      command: '',
      oid: 0,
      fields: [] as any,
    };
  }

  return pgPool.query<T>(text, params);
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await initDatabase();
  return rawQuery<T>(text, params);
}

export const DEFAULT_ROOM_TYPES = [
  {
    id: 'rt-standard-double',
    slug: 'standard-double-room',
    name: 'Standard Double Room',
    category: 'Hotel Rooms',
    size: '28 m²',
    bedType: 'Queen Bed',
    view: 'City View',
    basePriceETB: 5800,
    basePriceUSD: 50,
    baseCapacity: 2,
    maxCapacity: 2,
    description: 'Refined comfort for business and leisure travelers. Features comfortable queen bed, ergonomic desk, blackout drapes, and modern en-suite marble bathroom.',
    amenities: ['Queen Bed', 'High-Speed Wi-Fi', 'Work Station', 'Satellite HD TV', 'Tea & Ethiopian Coffee Maker', '24/7 Room Service', 'Daily Housekeeping', 'Electronic Safe'],
    images: ['/images/vikbooking/bo5a5902.jpg', '/images/vikbooking/big_bo5a5894.jpg', '/images/vikbooking/big_bo5a5900.jpg', '/hotel_images/1760816082.webp'],
    aliases: ['standard-room', 'double-rooms', 'standard', '1'],
  },
  {
    id: 'rt-twin-deluxe',
    slug: 'twin-deluxe-room',
    name: 'Twin Deluxe Room',
    category: 'Hotel Rooms',
    size: '34 m²',
    bedType: 'Two Double Beds',
    view: 'City View Balcony',
    basePriceETB: 7200,
    basePriceUSD: 62,
    baseCapacity: 2,
    maxCapacity: 3,
    description: 'Two plush double beds ideal for colleagues, friends, or small families visiting Addis Ababa. Includes private balcony, modern workspace, and city views.',
    amenities: ['2 Double Beds', 'City View Balcony', 'High-speed Wi-Fi', 'Spacious Marble Bathroom', 'Complimentary Breakfast', 'Electric Kettle', 'In-Room Safe'],
    images: ['/images/vikbooking/bo5a5832.jpg', '/images/vikbooking/big_260bo5a5832.jpg', '/images/vikbooking/big_bo5a5852.jpg', '/hotel_images/1760816141.webp'],
    aliases: ['twin-room', 'twin-deluxe', '3'],
  },
  {
    id: 'rt-deluxe-king',
    slug: 'deluxe-king-room',
    name: 'Deluxe King Room',
    category: 'Hotel Rooms',
    size: '36 m²',
    bedType: 'King Size Bed',
    view: 'Panoramic City & Mountain View',
    basePriceETB: 8500,
    basePriceUSD: 75,
    baseCapacity: 2,
    maxCapacity: 3,
    description: 'Spacious luxury room featuring a plush king-sized bed, panoramic balcony with skyline view of Addis Ababa, marble bathroom with deep soaking tub and rainfall shower, and ergonomic work desk.',
    amenities: ['King Bed', 'Private Balcony', 'High-speed Wi-Fi', 'Rainfall Shower & Soaking Tub', 'Smart 55" 4K TV', 'Mini-bar & Refreshment Station', 'Complimentary Breakfast', '24/7 Room Service'],
    images: ['/images/vikbooking/bo5a5878.jpg', '/images/vikbooking/big_bo5a5868.jpg', '/images/BO5A5826-scaled.jpg', '/hotel_images/1760816140.webp'],
    aliases: ['deluxe-room', 'deluxe-king', '2'],
  },
  {
    id: 'rt-executive-suite',
    slug: 'executive-suite',
    name: 'Executive Suite with Balcony',
    category: 'Suites',
    size: '52 m²',
    bedType: 'Master King Bed + Daybed',
    view: 'Corner Skyline View',
    basePriceETB: 14000,
    basePriceUSD: 120,
    baseCapacity: 2,
    maxCapacity: 4,
    description: 'An elevated luxury sanctuary with separated living room, master bedroom, executive lounge access, espresso bar, and scenic mountain and city views over the Bole district.',
    amenities: ['King Bed', 'Separate Living Room', 'Executive Lounge Access', 'Espresso Machine', 'Panoramic Balcony', 'Bathtub & Jacuzzi', 'VIP Airport Shuttle', 'Breakfast Buffet Included'],
    images: ['/images/BO5A5992-scaled.jpg', '/images/BO5A5989-scaled.jpg', '/images/BO5A5976-scaled.jpg', '/hotel_images/1760816139.webp'],
    aliases: ['grand-executive-suite', 'executive', '4'],
  },
  {
    id: 'rt-presidential-suite',
    slug: 'presidential-suite',
    name: 'Grand Addis Presidential Suite',
    category: 'Suites',
    size: '96 m²',
    bedType: 'Palatial King Master + Guest Suite',
    view: '360° Private Rooftop Terrace View',
    basePriceETB: 35000,
    basePriceUSD: 300,
    baseCapacity: 4,
    maxCapacity: 6,
    description: 'The pinnacle of luxury in Addis Ababa. Palatial top-floor residence with grand dining room, kitchen, private butler service, jacuzzi, and 360-degree terrace overlooking the capital.',
    amenities: ['Master King Bed + Guest Suite', '360° Private Rooftop Terrace', 'Jacuzzi Spa & Sauna', 'Private Dining Room & Kitchenette', 'Dedicated 24/7 Butler Service', 'Complimentary Limousine Airport Transfer', 'Full Stocked Mini-bar', 'Chef Tasting Experience'],
    images: ['/hotel_images/1760816135.webp', '/images/BO5A5992-scaled.jpg', '/images/BO5A5976-scaled.jpg', '/images/BO5A5805-scaled.jpg'],
    aliases: ['grand-presidential-suite', 'presidential', '5'],
  },
];

export const DEFAULT_PHYSICAL_ROOMS = [
  { id: 'rm-101', roomNumber: '101', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-102', roomNumber: '102', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-103', roomNumber: '103', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-104', roomNumber: '104', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-105', roomNumber: '105', floor: 1, roomTypeId: 'rt-standard-double' },
  { id: 'rm-201', roomNumber: '201', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-202', roomNumber: '202', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-203', roomNumber: '203', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-204', roomNumber: '204', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-205', roomNumber: '205', floor: 2, roomTypeId: 'rt-twin-deluxe' },
  { id: 'rm-301', roomNumber: '301', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-302', roomNumber: '302', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-303', roomNumber: '303', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-304', roomNumber: '304', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-305', roomNumber: '305', floor: 3, roomTypeId: 'rt-deluxe-king' },
  { id: 'rm-401', roomNumber: '401', floor: 4, roomTypeId: 'rt-executive-suite' },
  { id: 'rm-402', roomNumber: '402', floor: 4, roomTypeId: 'rt-executive-suite' },
  { id: 'rm-403', roomNumber: '403', floor: 4, roomTypeId: 'rt-executive-suite' },
  { id: 'rm-501', roomNumber: '501', floor: 5, roomTypeId: 'rt-presidential-suite' },
];

async function autoSeedDefaultsIfEmpty(): Promise<void> {
  // 1. Room Types Auto-seed
  try {
    const rtCountRes = await rawQuery(`SELECT COUNT(*) as count FROM room_types`);
    const rtCount = parseInt(rtCountRes.rows[0]?.count || '0', 10);
    if (rtCount === 0) {
      for (const r of DEFAULT_ROOM_TYPES) {
        const amenitiesVal = isMysql ? JSON.stringify(r.amenities) : r.amenities;
        const imagesVal = isMysql ? JSON.stringify(r.images) : r.images;
        const aliasesVal = isMysql ? JSON.stringify(r.aliases) : r.aliases;
        await rawQuery(
          `INSERT INTO room_types (
            id, slug, name, description, "baseCapacity", "maxCapacity", amenities, images,
            "basePriceETB", "basePriceUSD", size, "bedType", view, category, featured, aliases, "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15, NOW()
          )`,
          [
            r.id, r.slug, r.name, r.description, r.baseCapacity, r.maxCapacity,
            amenitiesVal, imagesVal, r.basePriceETB, r.basePriceUSD, r.size,
            r.bedType, r.view, r.category, aliasesVal
          ]
        );
      }
    }
  } catch (err) {
    console.warn('Auto-seed room_types notice:', err);
  }

  // 2. Physical Rooms Inventory Auto-seed
  try {
    const rmCountRes = await rawQuery(`SELECT COUNT(*) as count FROM rooms`);
    const rmCount = parseInt(rmCountRes.rows[0]?.count || '0', 10);
    if (rmCount === 0) {
      for (const rm of DEFAULT_PHYSICAL_ROOMS) {
        await rawQuery(
          `INSERT INTO rooms (id, "roomNumber", floor, status, "roomTypeId", "updatedAt")
           VALUES ($1, $2, $3, 'AVAILABLE', $4, NOW())`,
          [rm.id, rm.roomNumber, rm.floor, rm.roomTypeId]
        );
      }
    }
  } catch (err) {
    console.warn('Auto-seed rooms notice:', err);
  }

  // 3. Gallery Images Auto-seed
  try {
    const galCountRes = await rawQuery(`SELECT COUNT(*) as count FROM gallery_images`);
    const galCount = parseInt(galCountRes.rows[0]?.count || '0', 10);
    if (galCount === 0) {
      for (let i = 0; i < GALLERY_IMAGES.length; i++) {
        const item = GALLERY_IMAGES[i];
        const id = `gal-${i + 1}`;
        await rawQuery(
          `INSERT INTO gallery_images (id, src, title, category, sort_order) VALUES ($1, $2, $3, $4, $5)`,
          [id, item.src, item.title, item.category, i + 1]
        );
      }
    }
  } catch (err) {
    console.warn('Auto-seed gallery notice:', err);
  }

  // 4. Experiences Auto-seed
  try {
    const expCountRes = await rawQuery(`SELECT COUNT(*) as count FROM experiences`);
    const expCount = parseInt(expCountRes.rows[0]?.count || '0', 10);
    if (expCount === 0) {
      for (const exp of EXPERIENCES) {
        const highlightsVal = isMysql ? JSON.stringify(exp.highlights) : exp.highlights;
        await rawQuery(
          `INSERT INTO experiences (id, title, subtitle, category, duration, image, description, highlights)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [exp.id, exp.title, exp.subtitle, exp.category, exp.duration, exp.image, exp.description, highlightsVal]
        );
      }
    }
    // 5. FAQs Auto-seed
    try {
      const faqCountRes = await rawQuery(`SELECT COUNT(*) as count FROM faqs`);
      const faqCount = parseInt(faqCountRes.rows[0]?.count || '0', 10);
      if (faqCount === 0) {
        for (const faq of DEFAULT_FAQS) {
          await rawQuery(
            `INSERT INTO faqs (id, question, answer, category, sort_order) VALUES ($1, $2, $3, $4, $5)`,
            [faq.id, faq.question, faq.answer, faq.category, faq.sort_order]
          );
        }
      }
    } catch (err) {
      console.warn('Auto-seed faqs notice:', err);
    }

    // 6. Promotions Auto-seed
    try {
      const promoCountRes = await rawQuery(`SELECT COUNT(*) as count FROM promotions`);
      const promoCount = parseInt(promoCountRes.rows[0]?.count || '0', 10);
      if (promoCount === 0) {
        for (const promo of DEFAULT_PROMOTIONS) {
          const inclusionsVal = isMysql ? JSON.stringify(promo.inclusions) : promo.inclusions;
          await rawQuery(
            `INSERT INTO promotions (id, title, badge, discount, description, inclusions, code, valid_until)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [promo.id, promo.title, promo.badge, promo.discount, promo.description, inclusionsVal, promo.code, promo.valid_until]
          );
        }
      }
    } catch (err) {
      console.warn('Auto-seed promotions notice:', err);
    }
  } catch (err) {
    console.warn('Auto-seed experiences notice:', err);
  }
}

export const DEFAULT_FAQS = [
  {
    id: 'f1',
    question: 'How do I reserve a room at Grand Addis Hotel?',
    answer:
      'Reservations can be made directly through our online booking engine on this website, by calling our 24/7 reservations desk at +251 116 672 828, or by emailing reservations@egrandaddishotel.com. You will receive an instant confirmation voucher.',
    category: 'reservations',
    sort_order: 1,
  },
  {
    id: 'f2',
    question: 'What are the check-in and check-out times?',
    answer:
      'Check-in is from 14:00 (2:00 PM) onwards, and check-out is until 12:00 (12:00 PM). Early check-in or late check-out is subject to room availability upon arrival; you are always welcome to store luggage in our secure room and enjoy the lounge and dining areas.',
    category: 'checkin',
    sort_order: 2,
  },
  {
    id: 'f3',
    question: 'Do you offer airport transportation from Bole International Airport?',
    answer:
      'Yes! We offer convenient airport pick-up and drop-off services. Bole International Airport (ADD) is approximately 10-15 minutes away (5.2 km). You can add airport transfer during your online booking or contact our concierge prior to arrival with your flight details.',
    category: 'services',
    sort_order: 3,
  },
  {
    id: 'f4',
    question: 'What payment methods are accepted at the hotel?',
    answer:
      'We accept major international credit and debit cards (Visa, MasterCard, American Express), international bank transfers, and local Ethiopian payment methods including cash in ETB, Telebirr, and CBE Birr.',
    category: 'payment',
    sort_order: 4,
  },
  {
    id: 'f5',
    question: 'What is your cancellation and modification policy?',
    answer:
      'Flexible rate reservations can be cancelled or modified free of charge up to 24 hours prior to scheduled check-in date. Promotional and non-refundable rates may carry specific conditions indicated during booking.',
    category: 'reservations',
    sort_order: 5,
  },
  {
    id: 'f6',
    question: 'Is high-speed Wi-Fi available throughout the hotel?',
    answer:
      'Yes, complimentary high-speed fiber-optic Wi-Fi is available across all guest rooms, suites, restaurants, conference halls, and lobby areas.',
    category: 'services',
    sort_order: 6,
  },
  {
    id: 'f7',
    question: 'Are dining and room service available 24/7?',
    answer:
      'Our main restaurant serves breakfast from 06:30 to 10:30, lunch from 12:00 to 15:00, and dinner from 18:30 to 22:30. An in-room dining night menu is available 24 hours a day for your convenience.',
    category: 'services',
    sort_order: 7,
  },
];

export const DEFAULT_PROMOTIONS = [
  {
    id: 'promo1',
    title: 'Member Exclusive Stay',
    badge: 'Best Value',
    discount: 'Save 15%',
    description:
      'Book direct as a Grand Addis member and unlock 15% off room rates, complimentary high-speed Wi-Fi, late check-out upon availability, and 24-hour fitness access.',
    inclusions: [
      '15% discount on all room categories',
      'Daily complimentary breakfast buffet',
      'Late check-out until 15:00 (subject to availability)',
      'Complimentary airport pickup on bookings of 3+ nights',
    ],
    code: 'GRANDMEMBER15',
    valid_until: 'December 31, 2026',
  },
  {
    id: 'promo2',
    title: 'Dinner, Bed & Breakfast Package',
    badge: 'Popular',
    discount: 'Full Board Perks',
    description:
      'A seamless, fully flexible package combining luxurious overnight accommodation, hearty breakfast, and a 3-course dinner from our restaurant set menu.',
    inclusions: [
      'Luxury room or suite accommodation',
      'Full buffet breakfast daily',
      'Three-course evening dinner for two resident adults',
      'High-speed Wi-Fi in rooms and public spaces',
    ],
    code: 'DINNERBED26',
    valid_until: 'Ongoing',
  },
  {
    id: 'promo3',
    title: 'Weekend Rebalance Retreat',
    badge: 'Weekend Special',
    discount: 'Save 20%',
    description:
      'Designed for quick weekend escapes and couples. Enjoy complimentary bottle of sparkling wine on arrival, 30% discount on spa treatments, and leisurely Sunday brunch.',
    inclusions: [
      'Welcome sparkling wine & fresh fruit basket',
      '30% discount on all spa treatments',
      'Sunday late checkout until 16:00',
      'Complimentary access to steam and sauna',
    ],
    code: 'WEEKENDREBALANCE',
    valid_until: 'Year-Round (Fri-Sun)',
  },
];

// -------------------------------------------------------------
// High-performance In-Memory TTL Cache
// -------------------------------------------------------------
const cacheStore = new Map<string, { data: any; expiry: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs = 45000): void {
  cacheStore.set(key, { data, expiry: Date.now() + ttlMs });
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyPrefix)) {
      cacheStore.delete(key);
    }
  }
}

// -------------------------------------------------------------
// High-level Typed Database Access Methods
// -------------------------------------------------------------

export interface DbRoom {
  id: string;
  slug: string;
  name: string;
  category: string;
  pricePerNight: number;
  basePriceETB: number;
  basePriceUSD: number;
  capacity: number;
  size: string;
  bedType: string;
  view: string;
  description: string;
  images: string[];
  amenities: string[];
  featured: boolean;
  availableCount: number;
  aliases: string[];
}

function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    if (val.trim().startsWith('{') && val.trim().endsWith('}')) {
      return val.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^"|"$/g, ''));
    }
  }
  return [];
}

export async function resolveDbRoomType(
  roomId?: string | null,
  roomSlug?: string | null
): Promise<any | null> {
  await initDatabase();

  const idStr = (roomId ? String(roomId) : '').trim();
  const slugStr = (roomSlug ? String(roomSlug) : '').trim();

  if (!idStr && !slugStr) return null;

  // 1. Fetch current room types from database
  let roomTypesRes = await rawQuery(`SELECT * FROM room_types`);
  let roomTypes = roomTypesRes.rows;

  // If table is completely empty, auto-seed defaults and re-fetch
  if (roomTypes.length === 0) {
    await autoSeedDefaultsIfEmpty();
    roomTypesRes = await rawQuery(`SELECT * FROM room_types`);
    roomTypes = roomTypesRes.rows;
  }

  if (roomTypes.length === 0) return null;

  const norm = (s: any) => String(s || '').toLowerCase().trim();

  const legacyMap: Record<string, string[]> = {
    '1': ['standard-double-room', 'standard-room', 'rt-standard-double', 'standard'],
    '2': ['deluxe-king-room', 'deluxe-room', 'rt-deluxe-king', 'deluxe'],
    '3': ['twin-deluxe-room', 'twin-room', 'rt-twin-deluxe', 'twin'],
    '4': ['executive-suite', 'grand-executive-suite', 'rt-executive-suite', 'executive'],
    '5': ['presidential-suite', 'grand-presidential-suite', 'rt-presidential-suite', 'presidential'],
  };

  const idNorm = norm(idStr);
  const slugNorm = norm(slugStr);
  const targetTerms = new Set<string>();
  if (idNorm) targetTerms.add(idNorm);
  if (slugNorm) targetTerms.add(slugNorm);

  if (legacyMap[idStr]) {
    for (const t of legacyMap[idStr]) targetTerms.add(t.toLowerCase());
  }
  if (legacyMap[slugStr]) {
    for (const t of legacyMap[slugStr]) targetTerms.add(t.toLowerCase());
  }

  if (idNorm === 'standard-room' || slugNorm === 'standard-room') {
    targetTerms.add('standard-double-room');
    targetTerms.add('rt-standard-double');
  }
  if (idNorm === 'deluxe-room' || slugNorm === 'deluxe-room') {
    targetTerms.add('deluxe-king-room');
    targetTerms.add('rt-deluxe-king');
  }
  if (idNorm === 'twin-room' || slugNorm === 'twin-room') {
    targetTerms.add('twin-deluxe-room');
    targetTerms.add('rt-twin-deluxe');
  }
  if (idNorm === 'executive-suite' || slugNorm === 'executive-suite') {
    targetTerms.add('rt-executive-suite');
    targetTerms.add('grand-executive-suite');
  }
  if (idNorm === 'presidential-suite' || slugNorm === 'presidential-suite') {
    targetTerms.add('rt-presidential-suite');
    targetTerms.add('grand-presidential-suite');
  }

  // Priority 1: Exact ID match
  for (const rt of roomTypes) {
    if (norm(rt.id) === idNorm || norm(rt.id) === slugNorm) {
      return rt;
    }
  }

  // Priority 2: Exact canonical slug match
  for (const rt of roomTypes) {
    if (norm(rt.slug) === slugNorm || norm(rt.slug) === idNorm) {
      return rt;
    }
  }

  // Priority 3: Target terms match against rt.id or rt.slug
  for (const rt of roomTypes) {
    if (targetTerms.has(norm(rt.id)) || targetTerms.has(norm(rt.slug))) {
      return rt;
    }
  }

  // Priority 4: Alias array match
  for (const rt of roomTypes) {
    const aliases = parseJsonArray(rt.aliases).map(norm);
    for (const term of targetTerms) {
      if (aliases.includes(term)) {
        return rt;
      }
    }
  }

  // Priority 5: Partial word match (e.g. "deluxe" in "deluxe-king-room")
  for (const term of targetTerms) {
    if (term.length < 4) continue;
    for (const rt of roomTypes) {
      const rtSlug = norm(rt.slug);
      const rtName = norm(rt.name);
      if (rtSlug.includes(term) || term.includes(rtSlug) || rtName.includes(term)) {
        return rt;
      }
    }
  }

  return null;
}

export async function getDbRooms(): Promise<DbRoom[]> {
  const cached = getCached<DbRoom[]>('db_rooms');
  if (cached) return cached;

  try {
    let res = await query(`
      SELECT 
        rt.id,
        rt.slug,
        rt.name,
        rt.description,
        rt."baseCapacity",
        rt."maxCapacity",
        COALESCE(rt.size, '32 m²') AS size,
        COALESCE(rt."bedType", 'King Bed') AS "bedType",
        COALESCE(rt.view, 'City View') AS view,
        COALESCE(rt.category, 'Hotel Rooms') AS category,
        COALESCE(rt.featured, true) AS featured,
        rt.amenities,
        rt.images,
        rt."basePriceETB",
        rt."basePriceUSD",
        rt.aliases,
        SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS "availableCount"
      FROM room_types rt
      LEFT JOIN rooms r ON r."roomTypeId" = rt.id
      GROUP BY rt.id
      ORDER BY rt."basePriceUSD" ASC;
    `);

    if (res.rows.length === 0) {
      await autoSeedDefaultsIfEmpty();
      res = await query(`
        SELECT 
          rt.id,
          rt.slug,
          rt.name,
          rt.description,
          rt."baseCapacity",
          rt."maxCapacity",
          COALESCE(rt.size, '32 m²') AS size,
          COALESCE(rt."bedType", 'King Bed') AS "bedType",
          COALESCE(rt.view, 'City View') AS view,
          COALESCE(rt.category, 'Hotel Rooms') AS category,
          COALESCE(rt.featured, true) AS featured,
          rt.amenities,
          rt.images,
          rt."basePriceETB",
          rt."basePriceUSD",
          rt.aliases,
          SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS "availableCount"
        FROM room_types rt
        LEFT JOIN rooms r ON r."roomTypeId" = rt.id
        GROUP BY rt.id
        ORDER BY rt."basePriceUSD" ASC;
      `);
    }

    const rooms: DbRoom[] = res.rows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category || 'Hotel Rooms',
      pricePerNight: Number(row.basePriceUSD) || 50,
      basePriceETB: Number(row.basePriceETB) || 5800,
      basePriceUSD: Number(row.basePriceUSD) || 50,
      capacity: Number(row.baseCapacity) || 2,
      size: row.size || '32 m²',
      bedType: row.bedType || 'King Bed',
      view: row.view || 'City View',
      description: row.description,
      images: parseJsonArray(row.images),
      amenities: parseJsonArray(row.amenities),
      featured: row.featured !== false && row.featured !== 0,
      availableCount: Number(row.availableCount) || 0,
      aliases: parseJsonArray(row.aliases),
    }));

    setCached('db_rooms', rooms, 60000);
    return rooms;
  } catch (error) {
    console.error('getDbRooms error:', error);
    return [];
  }
}

export async function getDbRoomBySlug(slug: string): Promise<DbRoom | null> {
  const cacheKey = `db_room_${slug.toLowerCase()}`;
  const cached = getCached<DbRoom>(cacheKey);
  if (cached) return cached;

  try {
    const rt = await resolveDbRoomType(null, slug);
    if (!rt) return null;

    let availableCount = 0;
    try {
      const availRes = await query(
        `SELECT COUNT(*) as count FROM rooms WHERE "roomTypeId" = $1 AND status = 'AVAILABLE'`,
        [rt.id]
      );
      availableCount = Number(availRes.rows[0]?.count || 0);
    } catch {
      availableCount = 2;
    }

    const room: DbRoom = {
      id: rt.id,
      slug: rt.slug,
      name: rt.name,
      category: rt.category || 'Hotel Rooms',
      pricePerNight: Number(rt.basePriceUSD) || 50,
      basePriceETB: Number(rt.basePriceETB) || 5800,
      basePriceUSD: Number(rt.basePriceUSD) || 50,
      capacity: Number(rt.baseCapacity) || 2,
      size: rt.size || '32 m²',
      bedType: rt.bedType || 'King Bed',
      view: rt.view || 'City View',
      description: rt.description,
      images: parseJsonArray(rt.images),
      amenities: parseJsonArray(rt.amenities),
      featured: rt.featured !== false && rt.featured !== 0,
      availableCount,
      aliases: parseJsonArray(rt.aliases),
    };

    setCached(cacheKey, room, 60000);
    return room;
  } catch (error) {
    console.error('getDbRoomBySlug error:', error);
    return null;
  }
}

export async function getDbExperiences() {
  const cached = getCached<any[]>('db_experiences');
  if (cached) return cached;

  try {
    const res = await query(`SELECT * FROM experiences ORDER BY created_at ASC`);
    if (res.rows.length === 0) {
      return EXPERIENCES;
    }
    const experiences = res.rows.map((row: any) => ({
      ...row,
      highlights: parseJsonArray(row.highlights),
    }));
    setCached('db_experiences', experiences, 60000);
    return experiences;
  } catch (e) {
    console.error('getDbExperiences error:', e);
    return EXPERIENCES;
  }
}

export async function addDbExperience(exp: {
  title: string;
  subtitle: string;
  category: string;
  duration: string;
  image: string;
  description: string;
  highlights: string[];
}): Promise<any> {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const highlightsVal = isMysql ? JSON.stringify(exp.highlights) : exp.highlights;
  await query(
    `INSERT INTO experiences (id, title, subtitle, category, duration, image, description, highlights)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, exp.title, exp.subtitle, exp.category, exp.duration, exp.image, exp.description, highlightsVal]
  );
  invalidateCache('db_experiences');
  return { id, ...exp };
}

export async function updateDbExperience(
  id: string,
  exp: Partial<{
    title: string;
    subtitle: string;
    category: string;
    duration: string;
    image: string;
    description: string;
    highlights: string[];
  }>
): Promise<boolean> {
  const highlightsVal = exp.highlights
    ? isMysql
      ? JSON.stringify(exp.highlights)
      : exp.highlights
    : null;

  const res = await query(
    `UPDATE experiences
     SET title = COALESCE($1, title),
         subtitle = COALESCE($2, subtitle),
         category = COALESCE($3, category),
         duration = COALESCE($4, duration),
         image = COALESCE($5, image),
         description = COALESCE($6, description),
         highlights = COALESCE($7, highlights)
     WHERE id = $8`,
    [
      exp.title ?? null,
      exp.subtitle ?? null,
      exp.category ?? null,
      exp.duration ?? null,
      exp.image ?? null,
      exp.description ?? null,
      highlightsVal,
      id,
    ]
  );
  invalidateCache('db_experiences');
  return (res.rowCount ?? 0) > 0;
}

export async function deleteDbExperience(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM experiences WHERE id = $1`, [id]);
  invalidateCache('db_experiences');
  return (res.rowCount ?? 0) > 0;
}

export async function getDbMenuItems() {
  try {
    const res = await query(`SELECT * FROM dining_menu ORDER BY id ASC`);
    return res.rows;
  } catch (e) {
    console.error('getDbMenuItems error:', e);
    return [];
  }
}

export async function getDbSpaTreatments() {
  try {
    const res = await query(`SELECT * FROM spa_treatments ORDER BY id ASC`);
    return res.rows;
  } catch (e) {
    console.error('getDbSpaTreatments error:', e);
    return [];
  }
}

export async function getDbPromotions() {
  try {
    const res = await query(`SELECT * FROM promotions ORDER BY created_at DESC`);
    return res.rows.map((row: any) => ({
      ...row,
      inclusions: parseJsonArray(row.inclusions),
    }));
  } catch (e) {
    console.error('getDbPromotions error:', e);
    return [];
  }
}

export async function getDbFaqs() {
  const cached = getCached<any[]>('db_faqs');
  if (cached) return cached;

  try {
    const res = await query(`SELECT * FROM faqs ORDER BY sort_order ASC, id ASC`);
    setCached('db_faqs', res.rows, 60000);
    return res.rows;
  } catch (e) {
    console.error('getDbFaqs error:', e);
    return [];
  }
}

export async function addDbFaq(faq: {
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
}) {
  const id = `faq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const category = (faq.category || 'general').trim();
  const sort_order = Number(faq.sort_order) || 0;
  await query(
    `INSERT INTO faqs (id, question, answer, category, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [id, faq.question.trim(), faq.answer.trim(), category, sort_order]
  );
  invalidateCache('db_faqs');
  return { id, question: faq.question.trim(), answer: faq.answer.trim(), category, sort_order };
}

export async function updateDbFaq(faq: {
  id: string;
  question: string;
  answer: string;
  category?: string;
  sort_order?: number;
}) {
  const category = (faq.category || 'general').trim();
  const sort_order = Number(faq.sort_order) || 0;
  await query(
    `UPDATE faqs SET question = $1, answer = $2, category = $3, sort_order = $4 WHERE id = $5`,
    [faq.question.trim(), faq.answer.trim(), category, sort_order, faq.id]
  );
  invalidateCache('db_faqs');
  return { id: faq.id, question: faq.question.trim(), answer: faq.answer.trim(), category, sort_order };
}

export async function deleteDbFaq(id: string) {
  await query(`DELETE FROM faqs WHERE id = $1`, [id]);
  invalidateCache('db_faqs');
  return true;
}

export async function addDbPromotion(promo: {
  title: string;
  badge?: string;
  discount: string;
  description: string;
  inclusions?: string[] | string;
  code: string;
  valid_until?: string;
}) {
  const id = `promo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const badge = (promo.badge || 'Offer').trim();
  const valid_until = (promo.valid_until || 'Ongoing').trim();
  const inclusionsArr = Array.isArray(promo.inclusions)
    ? promo.inclusions.filter(Boolean)
    : typeof promo.inclusions === 'string'
    ? promo.inclusions.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const inclusionsVal = isMysql ? JSON.stringify(inclusionsArr) : inclusionsArr;

  await query(
    `INSERT INTO promotions (id, title, badge, discount, description, inclusions, code, valid_until)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, promo.title.trim(), badge, promo.discount.trim(), promo.description.trim(), inclusionsVal, promo.code.trim().toUpperCase(), valid_until]
  );
  invalidateCache('db_promotions');
  return { id, ...promo, inclusions: inclusionsArr, badge, valid_until };
}

export async function updateDbPromotion(promo: {
  id: string;
  title: string;
  badge?: string;
  discount: string;
  description: string;
  inclusions?: string[] | string;
  code: string;
  valid_until?: string;
}) {
  const badge = (promo.badge || 'Offer').trim();
  const valid_until = (promo.valid_until || 'Ongoing').trim();
  const inclusionsArr = Array.isArray(promo.inclusions)
    ? promo.inclusions.filter(Boolean)
    : typeof promo.inclusions === 'string'
    ? promo.inclusions.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const inclusionsVal = isMysql ? JSON.stringify(inclusionsArr) : inclusionsArr;

  await query(
    `UPDATE promotions SET title = $1, badge = $2, discount = $3, description = $4, inclusions = $5, code = $6, valid_until = $7 WHERE id = $8`,
    [promo.title.trim(), badge, promo.discount.trim(), promo.description.trim(), inclusionsVal, promo.code.trim().toUpperCase(), valid_until, promo.id]
  );
  invalidateCache('db_promotions');
  return { ...promo, inclusions: inclusionsArr, badge, valid_until };
}

export async function deleteDbPromotion(id: string) {
  await query(`DELETE FROM promotions WHERE id = $1`, [id]);
  invalidateCache('db_promotions');
  return true;
}

export function formatMapEmbedUrl(rawUrl?: string): string {
  const defaultEmbed =
    'https://maps.google.com/maps?q=9.0138943,38.7911099(Grand+Addis+Hotel)&z=17&output=embed';
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return defaultEmbed;
  }
  const clean = rawUrl.trim();
  // If user pasted iframe HTML like <iframe src="..." ...>
  const iframeMatch = clean.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1];
  }
  // If it's already an embed URL
  if (clean.includes('output=embed') || clean.includes('/maps/embed')) {
    return clean;
  }
  // If it's a Google Maps Place URL containing coordinates 3d... and 4d...
  const coordMatch = clean.match(/!3d(-?[0-9.]+)!4d(-?[0-9.]+)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}(Grand+Addis+Hotel)&z=17&output=embed`;
  }
  // If coordinates are in q=lat,lng
  const qCoordMatch = clean.match(/[?&]q=(-?[0-9.]+),(-?[0-9.]+)/);
  if (qCoordMatch) {
    return `https://maps.google.com/maps?q=${qCoordMatch[1]},${qCoordMatch[2]}(Grand+Addis+Hotel)&z=17&output=embed`;
  }
  // If it's just any general google maps place url, default to Grand Addis coordinates
  if (clean.includes('google.com/maps')) {
    return defaultEmbed;
  }
  return clean;
}

export async function getDbTestimonials() {
  const cached = getCached<any[]>('db_testimonials');
  if (cached) return cached;

  try {
    const res = await query(
      `SELECT * FROM testimonials WHERE status = 'APPROVED' ORDER BY created_at DESC LIMIT 10`
    );
    setCached('db_testimonials', res.rows, 60000);
    return res.rows;
  } catch (e) {
    console.error('getDbTestimonials error:', e);
    return [];
  }
}

export async function getDbStats() {
  try {
    const [resCount, roomCount, diningCount, spaCount, contactCount, testCount] = await Promise.all([
      query(`SELECT COUNT(*) as count, COALESCE(SUM("totalAmount"), 0) as revenue FROM reservations`),
      query(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available FROM rooms`),
      query(`SELECT COUNT(*) as count FROM table_reservations`),
      query(`SELECT COUNT(*) as count FROM spa_appointments`),
      query(`SELECT COUNT(*) as count FROM contact_messages`),
      query(`SELECT COUNT(*) as count FROM testimonials`),
    ]);

    return {
      reservations: {
        total: parseInt(resCount.rows[0].count, 10),
        revenue: parseFloat(resCount.rows[0].revenue),
      },
      rooms: {
        total: parseInt(roomCount.rows[0].total, 10),
        available: parseInt(roomCount.rows[0].available, 10) || 0,
      },
      dining: parseInt(diningCount.rows[0].count, 10),
      spa: parseInt(spaCount.rows[0].count, 10),
      contactMessages: parseInt(contactCount.rows[0].count, 10),
      testimonials: parseInt(testCount.rows[0].count, 10),
    };
  } catch (e) {
    console.error('getDbStats error:', e);
    return null;
  }
}

export async function getExchangeRate(): Promise<number> {
  const cached = getCached<number>('db_rate');
  if (cached !== null) return cached;

  try {
    const res = isMysql
      ? await rawQuery(`SELECT \`value\` FROM \`hotel_settings\` WHERE \`key\` = 'usd_to_etb_rate' LIMIT 1`)
      : await query(`SELECT value FROM hotel_settings WHERE "key" = 'usd_to_etb_rate' LIMIT 1`);
    if (res.rows.length > 0) {
      const val = parseFloat(res.rows[0].value);
      if (!isNaN(val) && val > 0) {
        setCached('db_rate', val, 30000);
        return val;
      }
    }
  } catch (e) {
    console.error('getExchangeRate error:', e);
  }
  return 189; // Default fallback rate
}

export async function setExchangeRate(
  newRate: number,
  syncRooms = false
): Promise<{ rate: number; updatedRoomsCount: number }> {
  const rateStr = newRate.toString();
  if (isMysql) {
    await rawQuery(
      `INSERT INTO \`hotel_settings\` (\`key\`, \`value\`, \`updated_at\`)
       VALUES ('usd_to_etb_rate', ?, NOW())
       ON DUPLICATE KEY UPDATE \`value\` = ?, \`updated_at\` = NOW()`,
      [rateStr, rateStr]
    );
  } else {
    await query(
      `INSERT INTO hotel_settings (key, value, updated_at)
       VALUES ('usd_to_etb_rate', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [rateStr]
    );
  }

  invalidateCache('db_rate');

  let updatedRoomsCount = 0;
  if (syncRooms) {
    if (isMysql) {
      const res = await rawQuery(
        `UPDATE \`room_types\`
         SET \`basePriceETB\` = ROUND(\`basePriceUSD\` * ?),
             \`updatedAt\` = NOW()`,
        [newRate]
      );
      updatedRoomsCount = res.rowCount || 0;
    } else {
      const res = await query(
        `UPDATE room_types
         SET "basePriceETB" = ROUND("basePriceUSD" * $1),
             "updatedAt" = CURRENT_TIMESTAMP`,
        [newRate]
      );
      updatedRoomsCount = res.rowCount || 0;
    }
    invalidateCache('db_room');
  }

  return { rate: newRate, updatedRoomsCount };
}

// -------------------------------------------------------------
// Photo Gallery Database Methods
// -------------------------------------------------------------
export interface DbGalleryImage {
  id: string;
  src: string;
  title: string;
  category: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export async function getDbGalleryImages(): Promise<DbGalleryImage[]> {
  const cached = getCached<DbGalleryImage[]>('db_gallery');
  if (cached) return cached;

  try {
    const res = await query(`SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at ASC`);
    if (res.rows.length === 0) {
      return GALLERY_IMAGES.map((img: any, i: number) => ({
        id: `gal-${i + 1}`,
        src: img.src,
        title: img.title,
        category: img.category,
        sort_order: i + 1,
      }));
    }
    const images: DbGalleryImage[] = res.rows.map((row: any) => ({
      id: String(row.id),
      src: row.src,
      title: row.title,
      category: row.category || 'hotel',
      sort_order: Number(row.sort_order) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    setCached('db_gallery', images, 45000);
    return images;
  } catch (error) {
    console.error('getDbGalleryImages error:', error);
    return GALLERY_IMAGES.map((img: any, i: number) => ({
      id: `gal-${i + 1}`,
      src: img.src,
      title: img.title,
      category: img.category,
      sort_order: i + 1,
    }));
  }
}

export async function addDbGalleryImage(item: {
  src: string;
  title: string;
  category: string;
  sort_order?: number;
}): Promise<DbGalleryImage> {
  const id = `gal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sortOrder = item.sort_order !== undefined ? item.sort_order : 99;
  await query(
    `INSERT INTO gallery_images (id, src, title, category, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [id, item.src, item.title, item.category || 'hotel', sortOrder]
  );
  invalidateCache('db_gallery');
  return {
    id,
    src: item.src,
    title: item.title,
    category: item.category || 'hotel',
    sort_order: sortOrder,
  };
}

export async function updateDbGalleryImage(
  id: string,
  item: { src?: string; title?: string; category?: string; sort_order?: number }
): Promise<boolean> {
  const res = await query(
    `UPDATE gallery_images
     SET src = COALESCE($1, src),
         title = COALESCE($2, title),
         category = COALESCE($3, category),
         sort_order = COALESCE($4, sort_order),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [item.src ?? null, item.title ?? null, item.category ?? null, item.sort_order ?? null, id]
  );
  invalidateCache('db_gallery');
  return (res.rowCount ?? 0) > 0;
}

export async function deleteDbGalleryImage(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM gallery_images WHERE id = $1`, [id]);
  invalidateCache('db_gallery');
  return (res.rowCount ?? 0) > 0;
}

// -------------------------------------------------------------
// Page Content & Banners CMS Database Methods
// -------------------------------------------------------------
export const DEFAULT_PAGE_CONTENT: Record<string, string> = {
  // Home Page
  page_home_hero_title: 'Your Grand Stay In The Heart Of Addis',
  page_home_hero_subtitle: '',
  page_home_hero_image: '/images/BO5A5779-scaled.jpg',
  page_home_hero_badge: 'Resort & Luxury Hotel in 22 Addis Ababa',
  page_home_hero_btn1_text: 'Book Your Stay',
  page_home_hero_btn2_text: 'Explore Our Rooms',

  page_home_rooms_subtitle: 'LUXURY ACCOMMODATIONS',
  page_home_rooms_title: 'Our Featured Rooms & Suites',
  page_home_rooms_desc: 'Immerse yourself in understated elegance. Best rates guaranteed when booking directly on our site.',

  page_home_banner_image: '/images/BO5A5779-scaled.jpg',
  page_home_banner_tag: 'BESPOKE HOSPITALITY',
  page_home_banner_title: 'Authentic Ethiopian Hospitality',
  page_home_banner_desc: 'Experience the genuine warmth and cultural heritage of Addis Ababa. From complimentary airport shuttle transfers to our daily traditional Buna ceremonies, we make your stay in Ethiopia unforgettable.',

  page_home_gallery_subtitle: 'VISUAL TOUR',
  page_home_gallery_title: 'GALLERY',
  page_home_gallery_desc: 'Explore the ambiance, architecture, and spaces of Grand Addis Hotel.',

  page_home_testimonials_subtitle: 'GUEST EXPERIENCES',
  page_home_testimonials_title: 'What Customers Have To Say',
  page_home_testimonials_desc: 'Real reviews from international and domestic guests who stayed at Grand Addis Hotel.',

  page_home_location_subtitle: 'FIND US',
  page_home_location_title: 'Location and Info',
  page_home_location_desc: 'Centrally positioned in the vibrant commercial and cultural heart of Addis Ababa, Grand Addis Hotel offers premier convenience for travelers and delegates.',

  // About Page
  page_about_hero_tag: 'OUR STORY & HERITAGE',
  page_about_hero_title: 'A Place Of Heart, Your Home Away',
  page_about_hero_subtitle: 'Welcome to our oasis of luxury and tranquility in Addis Ababa, where every aspect of your stay is meticulously crafted to exceed your expectations.',
  page_about_hero_image: '/images/BO5A5779-scaled.jpg',
  page_about_story_subtitle: 'THE GRAND ADDIS PHILOSOPHY',
  page_about_story_title: 'Where Tradition Meets Contemporary Elegance',
  page_about_story_p1: 'At Grand Addis Hotel, we believe hospitality is more than comfortable rooms—it is about creating an authentic sense of belonging. Nestled in 22 Around Golagul, we provide a peaceful sanctuary amidst the vibrant pulse of Addis Ababa.',
  page_about_story_p2: 'Immerse yourself in understated elegance, top-notch concierge service, authentic Ethiopian coffee ceremonies, and supreme comfort in the heart of Addis Ababa.',
  page_about_story_image: '/images/BO5A5821-scaled.jpg',
  page_about_timeline_subtitle: 'OUR JOURNEY',
  page_about_timeline_title: 'Milestones Through The Decades',
  page_about_timeline_desc: 'An enduring commitment to refined hospitality in Ethiopia.',
  page_about_why_subtitle: 'YOUR HAPPINESS GUARANTEED',
  page_about_why_title: 'Why Choose Grand Addis Hotel',
  page_about_why_desc: 'Whether you are seeking total relaxation, productive corporate stays, or cultural discovery.',

  // Contact Page & Hotel Info
  page_contact_hero_tag: 'GET IN TOUCH',
  page_contact_hero_title: 'Contact Grand Addis Hotel',
  page_contact_hero_subtitle: 'We would love to hear from you. Get in touch via our contact form, email, or direct phone.',
  page_contact_hero_image: '/images/BO5A5779-scaled.jpg',
  page_contact_intro_subtitle: '24/7 GUEST SUPPORT',
  page_contact_intro_title: 'We’re Here For You',
  page_contact_intro_desc: 'Whether you need assistance with room reservations, airport shuttle transfers, local city guides, or bespoke concierge requests, our team is always at your disposal.',
  page_contact_phone: '+251 116 672 828',
  page_contact_phone_alt: '+251 911 234 567',
  page_contact_email: 'reservations@egrandaddishotel.com',
  page_contact_email_alt: 'info@grandaddishotel.com',
  page_contact_address: '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia',
  page_contact_hours: 'Open 24 Hours • 7 Days a Week',
  page_contact_checkin: '14:00 (2:00 PM)',
  page_contact_checkout: '12:00 (12:00 PM)',
  page_contact_airport: '5.2 km from Addis Ababa Bole International Airport (approx. 10-15 mins)',
  hotel_social_facebook: 'https://facebook.com',
  hotel_social_instagram: 'https://instagram.com',
  hotel_social_telegram: 'https://t.me',

  // Gallery Page
  page_gallery_hero_tag: 'VISUAL IMMERSION',
  page_gallery_hero_title: 'Photo Gallery',
  page_gallery_hero_subtitle: 'Take a visual tour through Grand Addis Hotel. From bespoke suites to tranquil spa spaces and savory culinary creations.',
  page_gallery_hero_image: '/images/BO5A5779-scaled.jpg',

  // Experiences Page
  page_experiences_hero_tag: 'ETHIOPIAN CULTURE & TOURS',
  page_experiences_hero_title: 'Curated Ethiopian Experiences',
  page_experiences_hero_subtitle: 'Immerse yourself in authentic traditions, vibrant coffee ceremonies, city excursions, and bespoke culinary journeys.',
  page_experiences_hero_image: '/images/BO5A5779-scaled.jpg',

  // Rooms Page
  page_rooms_hero_tag: 'LUXURY ACCOMMODATION',
  page_rooms_hero_title: 'Our Rooms & Luxury Suites',
  page_rooms_hero_subtitle: 'Designed for total relaxation and productivity with plush bedding, marble bathrooms, and city skyline views.',
  page_rooms_hero_image: '/images/BO5A5779-scaled.jpg',

  // Testimonials Page
  page_testimonials_hero_tag: 'VERIFIED GUEST FEEDBACK',
  page_testimonials_hero_title: 'What Customers Have To Say',
  page_testimonials_hero_subtitle: 'Real reviews from international and domestic guests who stayed at Grand Addis Hotel.',
  page_testimonials_hero_image: '/images/BO5A5826-scaled.jpg',

  // Terms & Conditions Page
  page_terms_hero_tag: 'LEGAL & POLICIES',
  page_terms_hero_title: 'Terms & Conditions',
  page_terms_updated: 'Last updated: October 2026 • Grand Addis Hotel',
  page_terms_sec1_title: '1. General Hotel Policies',
  page_terms_sec1: 'Welcome to Grand Addis Hotel. By accessing this website or booking accommodations and services at our property (located at 22 Around Golagul, Addis Ababa, Ethiopia), you agree to comply with and be bound by these Terms and Conditions.',
  page_terms_sec2_title: '2. Reservations & Guarantee',
  page_terms_sec2: 'A valid reservation guarantee (via credit card, corporate agreement, or approved direct deposit) is required to secure any room reservation made through this site or directly with our front desk. All rates quoted on our direct reservation engine are in USD ($) and include 15% Value Added Tax (VAT) and municipal tourism fees.',
  page_terms_sec3_title: '3. Check-In & Check-Out Times',
  page_terms_sec3: 'Standard check-in time commences at 14:00 (2:00 PM) on the arrival date. Standard check-out time is until 12:00 (12:00 PM) on the departure date. Early check-in or late check-out is subject to room availability upon request. Complimentary secure luggage storage is provided for all registered guests.',
  page_terms_sec4_title: '4. Cancellation & Modifications',
  page_terms_sec4: 'Flexible rate bookings may be cancelled or modified free of charge up to 24 hours prior to standard check-in time. In the event of a late cancellation or no-show, the hotel reserves the right to charge the equivalent of the first night room charge. Non-refundable promotional rates are subject to the specific terms outlined during reservation.',
  page_terms_sec5_title: '5. Payment Terms & Card Guarantee',
  page_terms_sec5: 'Your credit card details entered during booking are securely processed through PCI DSS-compliant gateways and used strictly to guarantee your reservation. No unauthorized charges are applied prior to your check-in, except where specified under special non-refundable packages or in cases of unnotified no-show. We accept Mastercard, Visa, and domestic Ethiopian payment methods.',
  page_terms_sec6_title: '6. Contact & Inquiries',
  page_terms_sec6: 'For any questions concerning your stay, payment verification, or these policies, please contact our 24/7 guest relations department at our phone or email.',

  // FAQs Page
  page_faqs_hero_tag: 'FREQUENTLY ASKED QUESTIONS',
  page_faqs_hero_title: 'Everything You Need To Know',
  page_faqs_hero_subtitle: 'Answers to commonly asked questions about booking, check-in, amenities, dining, and your stay at Grand Addis Hotel.',
  page_faqs_hero_image: '/images/BO5A5779-scaled.jpg',

  // Map Embeds
  page_home_map_embed: 'https://maps.google.com/maps?q=9.0138943,38.7911099(Grand+Addis+Hotel)&z=17&output=embed',
  page_contact_map_embed: 'https://maps.google.com/maps?q=9.0138943,38.7911099(Grand+Addis+Hotel)&z=17&output=embed',

  // Footer & Branding
  page_footer_tag: 'EXPERIENCE LUXURY IN ETHIOPIA',
  page_footer_headline: 'Your Grand Stay In The Heart Of Addis',
  page_footer_desc: 'A place of heart, your home away in Addis Ababa. Where refined comfort meets authentic Ethiopian hospitality.',
  hotel_tagline: 'Distinctly designed rooms, timeless ambiance, and warm boutique service in the heart of Addis Ababa.',
  hotel_phone: '+251 116 672 828',
  hotel_email: 'reservations@egrandaddishotel.com',
  hotel_address: '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia',
};

export async function getDbPageContent(): Promise<Record<string, string>> {
  const cached = getCached<Record<string, string>>('db_page_content');
  if (cached) return cached;

  const content: Record<string, string> = { ...DEFAULT_PAGE_CONTENT };
  try {
    const res = isMysql
      ? await rawQuery(`SELECT \`key\`, \`value\` FROM \`hotel_settings\` WHERE \`key\` LIKE 'page_%' OR \`key\` LIKE 'hotel_%'`)
      : await query(`SELECT key, value FROM hotel_settings WHERE key LIKE 'page_%' OR key LIKE 'hotel_%'`);
    for (const row of (res.rows as any[])) {
      if (row.key && row.value !== undefined && row.value !== null) {
        content[row.key] = row.value;
      }
    }
    setCached('db_page_content', content, 60000);
  } catch (err) {
    console.error('getDbPageContent error:', err);
  }
  return content;
}

export async function updateDbPageContent(items: Record<string, string>): Promise<boolean> {
  for (const [key, val] of Object.entries(items)) {
    if (!key.startsWith('page_') && !key.startsWith('hotel_')) continue;
    const strVal = String(val ?? '');
    if (isMysql) {
      await rawQuery(
        `INSERT INTO \`hotel_settings\` (\`key\`, \`value\`, \`updated_at\`)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE \`value\` = ?, \`updated_at\` = NOW()`,
        [key, strVal, strVal]
      );
    } else {
      await query(
        `INSERT INTO hotel_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, strVal]
      );
    }
  }
  invalidateCache('db_page_content');
  return true;
}

/** Unified Pool object providing connection pooling & transactions across MySQL & PostgreSQL */
export const pool = {
  async connect(): Promise<PoolClient> {
    if (isMysql) {
      const conn = await mysqlPool.getConnection();
      await conn.query("SET SESSION sql_mode = 'ANSI_QUOTES,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'");
      return {
        async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
          const { sql, params: mysqlParams } = translateQueryForMysql(text, params);
          const [result] = await conn.query(sql, mysqlParams);
          const rows = Array.isArray(result) ? (result as T[]) : [];
          return {
            rows,
            rowCount: Array.isArray(result) ? rows.length : (result as any).affectedRows || 0,
            command: '',
            oid: 0,
            fields: [] as any,
          };
        },
        release() {
          conn.release();
        },
      } as unknown as PoolClient;
    }
    return pgPool.connect();
  },
  async query<T extends QueryResultRow = any>(text: string, params?: any[]) {
    return query<T>(text, params);
  },
};

export default pool;
