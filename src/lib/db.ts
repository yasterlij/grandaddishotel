import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';
import mysql from 'mysql2/promise';
import type { Pool as MysqlPool, PoolConnection } from 'mysql2/promise';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

export const isMysql =
  connectionString.startsWith('mysql://') || connectionString.startsWith('mysql:');

// Ensure single pool instance across Next.js reloads
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _mysqlPool: MysqlPool | undefined;
  // eslint-disable-next-line no-var
  var _dbInitPromise: Promise<void> | undefined;
}

let pgPool: Pool;
let mysqlPool: MysqlPool;

if (isMysql) {
  if (!global._mysqlPool) {
    global._mysqlPool = mysql.createPool({
      uri: connectionString,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00',
      dateStrings: true,
    });
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
        `);
      }
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

  return { sql: translated, params: params || [] };
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await initDatabase();

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

export async function getDbRooms(): Promise<DbRoom[]> {
  const cached = getCached<DbRoom[]>('db_rooms');
  if (cached) return cached;

  try {
    const res = await query(`
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
      featured: row.featured !== false,
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
    let res: QueryResult<any>;

    if (isMysql) {
      res = await query(
        `SELECT 
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
          COALESCE(rt.featured, 1) AS featured,
          rt.amenities,
          rt.images,
          rt."basePriceETB",
          rt."basePriceUSD",
          rt.aliases,
          SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS "availableCount"
        FROM room_types rt
        LEFT JOIN rooms r ON r."roomTypeId" = rt.id
        WHERE LOWER(rt.slug) = LOWER($1)
          OR LOWER(COALESCE(rt.aliases, '')) LIKE CONCAT('%', LOWER($1), '%')
        GROUP BY rt.id
        LIMIT 1;`,
        [slug]
      );
    } else {
      res = await query(
        `SELECT 
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
          COALESCE(rt.aliases, ARRAY[]::TEXT[]) AS aliases,
          SUM(CASE WHEN r.status = 'AVAILABLE' THEN 1 ELSE 0 END) AS "availableCount"
        FROM room_types rt
        LEFT JOIN rooms r ON r."roomTypeId" = rt.id
        WHERE LOWER(rt.slug) = LOWER($1)
          OR EXISTS (SELECT 1 FROM unnest(COALESCE(rt.aliases, ARRAY[]::TEXT[])) AS a WHERE LOWER(a) = LOWER($1))
        GROUP BY rt.id
        LIMIT 1;`,
        [slug]
      );
    }

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const room: DbRoom = {
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
      featured: row.featured !== false,
      availableCount: Number(row.availableCount) || 0,
      aliases: parseJsonArray(row.aliases),
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
    const experiences = res.rows.map((row) => ({
      ...row,
      highlights: parseJsonArray(row.highlights),
    }));
    setCached('db_experiences', experiences, 60000);
    return experiences;
  } catch (e) {
    console.error('getDbExperiences error:', e);
    return [];
  }
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
