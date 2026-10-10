import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment in priority order
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

  const finalUser = dbUser || parsedFromUrl.user || 'root';
  const finalPassword = dbPassword !== undefined ? dbPassword : (parsedFromUrl.password || '');
  const finalHost = dbHost || parsedFromUrl.host || '127.0.0.1';
  const finalPort = dbPort || parsedFromUrl.port || 3306;
  const finalDatabase = dbName || parsedFromUrl.database || 'grand_addis_db';

  return {
    host: finalHost,
    port: finalPort,
    user: finalUser,
    password: finalPassword,
    database: finalDatabase,
    multipleStatements: true,
  };
}

const TABLES = [
  {
    name: 'hotel_settings',
    sql: `
      CREATE TABLE IF NOT EXISTS \`hotel_settings\` (
        \`key\` VARCHAR(191) NOT NULL,
        \`value\` TEXT NOT NULL,
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'room_types',
    sql: `
      CREATE TABLE IF NOT EXISTS \`room_types\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`slug\` VARCHAR(191) NOT NULL,
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
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`idx_room_types_slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'rooms',
    sql: `
      CREATE TABLE IF NOT EXISTS \`rooms\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`roomNumber\` VARCHAR(50) NOT NULL,
        \`roomTypeId\` VARCHAR(191) NOT NULL,
        \`floor\` INT NOT NULL DEFAULT 1,
        \`status\` ENUM('AVAILABLE','OCCUPIED','MAINTENANCE','CLEANING') NOT NULL DEFAULT 'AVAILABLE',
        \`notes\` TEXT DEFAULT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`idx_rooms_number\` (\`roomNumber\`),
        KEY \`idx_rooms_roomTypeId\` (\`roomTypeId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'guests',
    sql: `
      CREATE TABLE IF NOT EXISTS \`guests\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`firstName\` VARCHAR(100) NOT NULL,
        \`lastName\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`country\` VARCHAR(100) DEFAULT 'Ethiopia',
        \`idNumber\` VARCHAR(100) DEFAULT NULL,
        \`notes\` TEXT DEFAULT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_guests_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'reservations',
    sql: `
      CREATE TABLE IF NOT EXISTS \`reservations\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`bookingRef\` VARCHAR(50) NOT NULL,
        \`guestId\` VARCHAR(191) NOT NULL,
        \`roomTypeId\` VARCHAR(191) NOT NULL,
        \`assignedRoomId\` VARCHAR(191) DEFAULT NULL,
        \`checkInDate\` DATE NOT NULL,
        \`checkOutDate\` DATE NOT NULL,
        \`nights\` INT NOT NULL,
        \`adults\` INT NOT NULL DEFAULT 1,
        \`children\` INT NOT NULL DEFAULT 0,
        \`totalAmountETB\` DECIMAL(10,2) NOT NULL,
        \`totalAmountUSD\` DECIMAL(10,2) NOT NULL,
        \`currency\` VARCHAR(10) NOT NULL DEFAULT 'ETB',
        \`status\` ENUM('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
        \`paymentStatus\` ENUM('PENDING','PAID','REFUNDED','FAILED') NOT NULL DEFAULT 'PENDING',
        \`source\` VARCHAR(50) NOT NULL DEFAULT 'DIRECT_WEB',
        \`specialRequests\` TEXT DEFAULT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`idx_reservations_ref\` (\`bookingRef\`),
        KEY \`idx_reservations_guestId\` (\`guestId\`),
        KEY \`idx_reservations_dates\` (\`checkInDate\`, \`checkOutDate\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'payments',
    sql: `
      CREATE TABLE IF NOT EXISTS \`payments\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`bookingId\` VARCHAR(191) DEFAULT NULL,
        \`bookingRef\` VARCHAR(50) DEFAULT NULL,
        \`txRef\` VARCHAR(100) NOT NULL,
        \`gatewayRef\` VARCHAR(100) DEFAULT NULL,
        \`amount\` DECIMAL(10,2) NOT NULL,
        \`currency\` VARCHAR(10) NOT NULL DEFAULT 'ETB',
        \`provider\` VARCHAR(50) NOT NULL DEFAULT 'SIKINA_PAY',
        \`status\` ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
        \`guestName\` VARCHAR(255) DEFAULT NULL,
        \`guestEmail\` VARCHAR(191) DEFAULT NULL,
        \`guestPhone\` VARCHAR(50) DEFAULT NULL,
        \`rawPayload\` JSON DEFAULT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`idx_payments_txRef\` (\`txRef\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'experiences',
    sql: `
      CREATE TABLE IF NOT EXISTS \`experiences\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`subtitle\` VARCHAR(255) DEFAULT NULL,
        \`category\` VARCHAR(100) NOT NULL DEFAULT 'Culture',
        \`duration\` VARCHAR(100) NOT NULL DEFAULT '2-3 Hours',
        \`image\` TEXT NOT NULL,
        \`description\` TEXT NOT NULL,
        \`highlights\` JSON DEFAULT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'testimonials',
    sql: `
      CREATE TABLE IF NOT EXISTS \`testimonials\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`rating\` INT NOT NULL DEFAULT 5,
        \`date\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`comment\` TEXT NOT NULL,
        \`room_type\` VARCHAR(255) DEFAULT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'gallery_images',
    sql: `
      CREATE TABLE IF NOT EXISTS \`gallery_images\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`src\` TEXT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL DEFAULT 'hotel',
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_gallery_category\` (\`category\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'dining_menu',
    sql: `
      CREATE TABLE IF NOT EXISTS \`dining_menu\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`price_etb\` DECIMAL(10,2) NOT NULL,
        \`price_usd\` DECIMAL(10,2) NOT NULL,
        \`description\` TEXT DEFAULT NULL,
        \`image\` TEXT DEFAULT NULL,
        \`is_vegetarian\` TINYINT(1) DEFAULT 0,
        \`is_specialty\` TINYINT(1) DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'spa_treatments',
    sql: `
      CREATE TABLE IF NOT EXISTS \`spa_treatments\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`duration\` VARCHAR(50) NOT NULL,
        \`price_etb\` DECIMAL(10,2) NOT NULL,
        \`price_usd\` DECIMAL(10,2) NOT NULL,
        \`description\` TEXT DEFAULT NULL,
        \`image\` TEXT DEFAULT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'contact_messages',
    sql: `
      CREATE TABLE IF NOT EXISTS \`contact_messages\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) DEFAULT NULL,
        \`subject\` VARCHAR(255) DEFAULT NULL,
        \`message\` TEXT NOT NULL,
        \`status\` ENUM('NEW','READ','REPLIED','ARCHIVED') NOT NULL DEFAULT 'NEW',
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'table_reservations',
    sql: `
      CREATE TABLE IF NOT EXISTS \`table_reservations\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`date\` DATE NOT NULL,
        \`time\` VARCHAR(20) NOT NULL,
        \`guests\` INT NOT NULL DEFAULT 2,
        \`special_requests\` TEXT DEFAULT NULL,
        \`status\` ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'spa_appointments',
    sql: `
      CREATE TABLE IF NOT EXISTS \`spa_appointments\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`treatment\` VARCHAR(255) NOT NULL,
        \`date\` DATE NOT NULL,
        \`time\` VARCHAR(20) NOT NULL,
        \`guests\` INT NOT NULL DEFAULT 1,
        \`notes\` TEXT DEFAULT NULL,
        \`status\` ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'event_inquiries',
    sql: `
      CREATE TABLE IF NOT EXISTS \`event_inquiries\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`event_type\` VARCHAR(100) NOT NULL,
        \`guest_count\` INT NOT NULL DEFAULT 50,
        \`date\` DATE NOT NULL,
        \`message\` TEXT DEFAULT NULL,
        \`status\` ENUM('NEW','IN_REVIEW','CONTACTED','ARCHIVED') NOT NULL DEFAULT 'NEW',
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'promotions',
    sql: `
      CREATE TABLE IF NOT EXISTS \`promotions\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`discount_percent\` INT NOT NULL DEFAULT 10,
        \`valid_until\` DATE DEFAULT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'faqs',
    sql: `
      CREATE TABLE IF NOT EXISTS \`faqs\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`question\` TEXT NOT NULL,
        \`answer\` TEXT NOT NULL,
        \`category\` VARCHAR(100) NOT NULL DEFAULT 'general',
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
];

async function migrateMysql() {
  const connConfig = getMysqlConnectionConfig();
  console.log(`\n============================================================`);
  console.log(`GRAND ADDIS HOTEL - SAFE SCHEMA MIGRATION`);
  console.log(`Target: ${connConfig.user}@${connConfig.host}:${connConfig.port}/${connConfig.database}`);
  console.log(`============================================================\n`);

  let connection;
  try {
    connection = await mysql.createConnection(connConfig);
    console.log('✓ Successfully connected to MySQL database.\n');

    for (const table of TABLES) {
      process.stdout.write(`Migrating table \`${table.name}\`... `);
      await connection.query(table.sql);
      console.log('✓ OK');
    }

    console.log(`\n✓ All ${TABLES.length} tables verified and migrated successfully!`);
    console.log(`(No existing customer reservations or bookings were altered)\n`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message || error);
    if (error.code === 'ER_ACCESS_DENIED_ERROR' || (error.message && error.message.includes('Access denied'))) {
      console.error('\n🔑 Please verify DB_USER, DB_PASSWORD, DB_HOST, and DB_NAME in .env or Plesk.');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrateMysql();
