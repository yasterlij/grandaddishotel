import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
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

  try {
    const ConnectionConfig = (mysql as any).ConnectionConfig;
    if (ConnectionConfig && typeof ConnectionConfig.parseUrl === 'function') {
      const parsed = ConnectionConfig.parseUrl(rawUrl) || {};
      return {
        user: parsed.user,
        password: parsed.password,
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
      };
    }
  } catch {
    // Ignore and fall back to a validation error below.
  }

  return {};
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

  const finalHost = dbHost || parsedFromUrl.host;
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
    port: dbPort || parsedFromUrl.port || 3306,
    user: finalUser,
    password: finalPassword,
    database: finalDatabase,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
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
        // Configure MySQL session for standard SQL compatibility (ANSI double-quote identifiers)
        await mysqlPool.query("SET SESSION sql_mode = 'ANSI_QUOTES,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'");

        // Ensure hotel_settings exists
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS hotel_settings (
            "key" VARCHAR(191) PRIMARY KEY,
            "value" TEXT NOT NULL,
            "updated_at" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);
        await mysqlPool.query(`
          INSERT INTO hotel_settings ("key", "value") VALUES ('usd_to_etb_rate', '189')
          ON DUPLICATE KEY UPDATE "value" = VALUES("value");
        `);

        // Ensure gallery_images exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS gallery_images (
            "id" VARCHAR(191) PRIMARY KEY,
            "src" TEXT NOT NULL,
            "title" VARCHAR(255) NOT NULL,
            "category" VARCHAR(100) NOT NULL DEFAULT 'hotel',
            "sort_order" INT NOT NULL DEFAULT 0,
            "created_at" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            "updated_at" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure room_types exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS room_types (
            "id" VARCHAR(191) PRIMARY KEY,
            "slug" VARCHAR(191) NOT NULL UNIQUE,
            "name" VARCHAR(255) NOT NULL,
            "description" TEXT NOT NULL,
            "baseCapacity" INT NOT NULL DEFAULT 2,
            "maxCapacity" INT NOT NULL DEFAULT 3,
            "amenities" JSON DEFAULT NULL,
            "images" JSON DEFAULT NULL,
            "basePriceETB" DECIMAL(10,2) NOT NULL DEFAULT 5800.00,
            "basePriceUSD" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
            "size" VARCHAR(50) DEFAULT '32 m²',
            "bedType" VARCHAR(100) DEFAULT 'King Bed',
            "view" VARCHAR(100) DEFAULT 'City View',
            "category" VARCHAR(100) DEFAULT 'Hotel Rooms',
            "featured" TINYINT(1) DEFAULT 1,
            "aliases" JSON DEFAULT NULL,
            "createdAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            "updatedAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure rooms exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS rooms (
            "id" VARCHAR(191) PRIMARY KEY,
            "roomNumber" VARCHAR(50) NOT NULL UNIQUE,
            "floor" INT NOT NULL DEFAULT 1,
            "status" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
            "roomTypeId" VARCHAR(191) NOT NULL,
            "createdAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            "updatedAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure guests exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS guests (
            "id" VARCHAR(191) PRIMARY KEY,
            "firstName" VARCHAR(100) NOT NULL,
            "lastName" VARCHAR(100) NOT NULL,
            "email" VARCHAR(191) NOT NULL UNIQUE,
            "phoneNumber" VARCHAR(100) NOT NULL,
            "nationalIdOrPass" VARCHAR(100) DEFAULT NULL,
            "createdAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            "updatedAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure reservations exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS reservations (
            "id" VARCHAR(191) PRIMARY KEY,
            "bookingRef" VARCHAR(100) NOT NULL UNIQUE,
            "checkInDate" DATE NOT NULL,
            "checkOutDate" DATE NOT NULL,
            "adultsCount" INT NOT NULL DEFAULT 1,
            "childrenCount" INT NOT NULL DEFAULT 0,
            "status" VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
            "expiresAt" DATETIME(3) DEFAULT NULL,
            "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
            "subtotal" DECIMAL(10,2) NOT NULL,
            "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            "totalAmount" DECIMAL(10,2) NOT NULL,
            "specialRequests" TEXT DEFAULT NULL,
            "guestId" VARCHAR(191) NOT NULL,
            "roomTypeId" VARCHAR(191) NOT NULL,
            "roomId" VARCHAR(191) DEFAULT NULL,
            "isDateExtended" TINYINT(1) DEFAULT 0,
            "dateChangeNote" TEXT DEFAULT NULL,
            "createdAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            "updatedAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);

        // Ensure payments exists in MySQL
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS payments (
            "id" VARCHAR(191) PRIMARY KEY,
            "amount" DECIMAL(10,2) NOT NULL,
            "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
            "provider" VARCHAR(50) NOT NULL DEFAULT 'CASH_ON_ARRIVAL',
            "status" VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
            "txRef" VARCHAR(191) NOT NULL UNIQUE,
            "gatewayRef" VARCHAR(191) DEFAULT NULL,
            "reservationId" VARCHAR(191) NOT NULL,
            "paidAt" DATETIME(3) DEFAULT NULL,
            "createdAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            "updatedAt" DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
          );
        `);
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
    (_match, setClause) => {
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

  // Normalize parameter types for MySQL (arrays/objects to JSON strings)
  const mysqlParams = (params || []).map((p) => {
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
  } catch (err) {
    console.warn('Auto-seed experiences notice:', err);
  }
}

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
      return val.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
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

    const rooms: DbRoom[] = res.rows.map((row) => ({
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
    const experiences = res.rows.map((row) => ({
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
    return res.rows.map((row) => ({
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
    const res = await query(`SELECT value FROM hotel_settings WHERE "key" = 'usd_to_etb_rate' LIMIT 1`);
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
  if (isMysql) {
    await query(
      `INSERT INTO hotel_settings ("key", "value", updated_at)
       VALUES ('usd_to_etb_rate', $1, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE "value" = VALUES("value"), updated_at = CURRENT_TIMESTAMP`,
      [newRate.toString()]
    );
  } else {
    await query(
      `INSERT INTO hotel_settings (key, value, updated_at)
       VALUES ('usd_to_etb_rate', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [newRate.toString()]
    );
  }

  invalidateCache('db_rate');

  let updatedRoomsCount = 0;
  if (syncRooms) {
    const res = await query(
      `UPDATE room_types
       SET "basePriceETB" = ROUND("basePriceUSD" * $1),
           "updatedAt" = CURRENT_TIMESTAMP`,
      [newRate]
    );
    updatedRoomsCount = res.rowCount || 0;
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
      return GALLERY_IMAGES.map((img, i) => ({
        id: `gal-${i + 1}`,
        src: img.src,
        title: img.title,
        category: img.category,
        sort_order: i + 1,
      }));
    }
    const images: DbGalleryImage[] = res.rows.map((row) => ({
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
    return GALLERY_IMAGES.map((img, i) => ({
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
  page_home_story_subtitle: 'THE GRAND ADDIS EXPERIENCE',
  page_home_story_title: 'A Sanctuary of Luxury & Warm Ethiopian Hospitality',
  page_home_story_p1: 'Located at 22 Around Golagul in Addis Ababa, Grand Addis Hotel stands as a landmark of distinction. Just 10 minutes from Bole International Airport, we offer an exquisite sanctuary for discerning business travelers, diplomats, and vacationers seeking refined comfort.',
  page_home_story_p2: 'From plush, acoustically shielded guest rooms to authentic Ethiopian coffee rituals, every detail is crafted to ensure your stay is extraordinary.',
  page_home_story_image: '/images/BO5A5821-scaled.jpg',

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

  // Contact Page & Hotel Info
  page_contact_hero_tag: 'GET IN TOUCH',
  page_contact_hero_title: 'Contact Grand Addis Hotel',
  page_contact_hero_subtitle: 'We would love to hear from you. Get in touch via our contact form, email, or direct phone.',
  page_contact_hero_image: '/images/BO5A5779-scaled.jpg',
  page_contact_phone: '+251 116 672 828',
  page_contact_phone_alt: '+251 911 234 567',
  page_contact_email: 'reservations@egrandaddishotel.com',
  page_contact_email_alt: 'info@grandaddishotel.com',
  page_contact_address: '22 Around Golagul, behind Meklit Building, Addis Ababa, Ethiopia',
  page_contact_checkin: '14:00 (2:00 PM)',
  page_contact_checkout: '12:00 (12:00 PM)',
  page_contact_airport: '5.2 km from Addis Ababa Bole International Airport (approx. 10-15 mins)',

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
};

export async function getDbPageContent(): Promise<Record<string, string>> {
  const cached = getCached<Record<string, string>>('db_page_content');
  if (cached) return cached;

  const content: Record<string, string> = { ...DEFAULT_PAGE_CONTENT };
  try {
    const res = await query(`SELECT "key", "value" FROM hotel_settings WHERE "key" LIKE 'page_%'`);
    for (const row of res.rows) {
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
    if (isMysql) {
      await query(
        `INSERT INTO hotel_settings ("key", "value", updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE "value" = VALUES("value"), updated_at = CURRENT_TIMESTAMP`,
        [key, String(val)]
      );
    } else {
      await query(
        `INSERT INTO hotel_settings (key, value, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(val)]
      );
    }
  }
  invalidateCache('db_page_content');
  return true;
}

/** Unified Pool object providing connection pooling & transactions across MySQL & PostgreSQL */
export const pool = {
  async connect() {
    if (isMysql) {
      const conn = await mysqlPool.getConnection();
      await conn.query("SET SESSION sql_mode = 'ANSI_QUOTES,STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'");
      return {
        async query(text: string, params?: any[]) {
          const { sql, params: mysqlParams } = translateQueryForMysql(text, params);
          const [result] = await conn.query(sql, mysqlParams);
          const rows = Array.isArray(result) ? result : [];
          return {
            rows,
            rowCount: Array.isArray(result) ? result.length : (result as any).affectedRows || 0,
          };
        },
        release() {
          conn.release();
        },
      };
    }
    return pgPool.connect();
  },
  async query<T extends QueryResultRow = any>(text: string, params?: any[]) {
    return query<T>(text, params);
  },
};

export default pool;
