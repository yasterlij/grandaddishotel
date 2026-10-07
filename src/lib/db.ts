import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

let pool: Pool;

// Ensure single pool instance across Next.js reloads
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}
pool = global._pgPool;

let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Alter room_types if needed
      await pool.query(`
        ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "size" TEXT DEFAULT '32 m²';
        ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "bedType" TEXT DEFAULT 'King Bed';
        ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "view" TEXT DEFAULT 'City View';
        ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'Hotel Rooms';
        ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT true;
        ALTER TABLE room_types ADD COLUMN IF NOT EXISTS "aliases" TEXT[] DEFAULT '{}';
      `);

      // 2. Auxiliary table: table_reservations (for Dining)
      await pool.query(`
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
      `);

      // 3. Auxiliary table: spa_appointments (for Wellness)
      await pool.query(`
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
      `);

      // 4. Auxiliary table: contact_messages (for Contact)
      await pool.query(`
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
      `);

      // 5. Auxiliary table: event_inquiries (for Weddings & Events)
      await pool.query(`
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
      `);

      // 6. Auxiliary table: testimonials (for Guest Reviews)
      await pool.query(`
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
      `);

      // 7. Auxiliary table: dining_menu
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dining_menu (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          description TEXT NOT NULL,
          tag TEXT,
          created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 8. Auxiliary table: spa_treatments
      await pool.query(`
        CREATE TABLE IF NOT EXISTS spa_treatments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          duration TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 9. Auxiliary table: experiences
      await pool.query(`
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
      `);

      // 10. Auxiliary table: promotions
      await pool.query(`
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
      `);

      // 11. Auxiliary table: faqs
      await pool.query(`
        CREATE TABLE IF NOT EXISTS faqs (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          category TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 12. Universal Settings table (Forex / Exchange Rate, etc.)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hotel_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP(3) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO hotel_settings (key, value)
        VALUES ('usd_to_etb_rate', '189')
        ON CONFLICT (key) DO NOTHING;
      `);
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  })();

  return initPromise;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await initDatabase();
  return pool.query<T>(text, params);
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

export async function getDbRooms(): Promise<DbRoom[]> {
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
        COALESCE(rt.aliases, ARRAY[]::TEXT[]) AS aliases,
        COUNT(r.id) FILTER (WHERE r.status = 'AVAILABLE') AS "availableCount"
      FROM room_types rt
      LEFT JOIN rooms r ON r."roomTypeId" = rt.id
      GROUP BY rt.id
      ORDER BY rt."basePriceUSD" ASC;
    `);

    return res.rows.map((row) => ({
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
      images: row.images || [],
      amenities: row.amenities || [],
      featured: row.featured !== false,
      availableCount: Number(row.availableCount) || 1,
      aliases: row.aliases || [],
    }));
  } catch (error) {
    console.error('getDbRooms error:', error);
    return [];
  }
}

export async function getDbRoomBySlug(slug: string): Promise<DbRoom | null> {
  try {
    const res = await query(
      `
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
        COALESCE(rt.aliases, ARRAY[]::TEXT[]) AS aliases,
        COUNT(r.id) FILTER (WHERE r.status = 'AVAILABLE') AS "availableCount"
      FROM room_types rt
      LEFT JOIN rooms r ON r."roomTypeId" = rt.id
      WHERE rt.slug = $1 OR $1 = ANY(rt.aliases)
      GROUP BY rt.id
      LIMIT 1;
    `,
      [slug]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
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
      images: row.images || [],
      amenities: row.amenities || [],
      featured: row.featured !== false,
      availableCount: Number(row.availableCount) || 1,
      aliases: row.aliases || [],
    };
  } catch (error) {
    console.error('getDbRoomBySlug error:', error);
    return null;
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

export async function getDbExperiences() {
  try {
    const res = await query(`SELECT * FROM experiences ORDER BY id ASC`);
    return res.rows;
  } catch (e) {
    console.error('getDbExperiences error:', e);
    return [];
  }
}

export async function getDbPromotions() {
  try {
    const res = await query(`SELECT * FROM promotions ORDER BY id ASC`);
    return res.rows;
  } catch (e) {
    console.error('getDbPromotions error:', e);
    return [];
  }
}

export async function getDbFaqs() {
  try {
    const res = await query(`SELECT * FROM faqs ORDER BY sort_order ASC, id ASC`);
    return res.rows;
  } catch (e) {
    console.error('getDbFaqs error:', e);
    return [];
  }
}

export async function getDbTestimonials() {
  try {
    const res = await query(
      `SELECT * FROM testimonials WHERE status = 'APPROVED' ORDER BY created_at DESC LIMIT 50`
    );
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
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available FROM rooms`),
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
        available: parseInt(roomCount.rows[0].available, 10),
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
  try {
    const res = await query(`SELECT value FROM hotel_settings WHERE key = 'usd_to_etb_rate' LIMIT 1`);
    if (res.rows.length > 0) {
      const val = parseFloat(res.rows[0].value);
      if (!isNaN(val) && val > 0) return val;
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
  await query(
    `INSERT INTO hotel_settings (key, value, updated_at)
     VALUES ('usd_to_etb_rate', $1, CURRENT_TIMESTAMP)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
    [newRate.toString()]
  );

  let updatedRoomsCount = 0;
  if (syncRooms) {
    const res = await query(
      `UPDATE room_types
       SET "basePriceETB" = ROUND("basePriceUSD" * $1),
           "updatedAt" = CURRENT_TIMESTAMP
       RETURNING id`,
      [newRate]
    );
    updatedRoomsCount = res.rowCount || 0;
  }

  return { rate: newRate, updatedRoomsCount };
}

export default pool;
