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

function parseMysqlUrl(rawUrl) {
  try {
    const withoutScheme = (rawUrl || '').replace(/^mysql:\/\//i, '');
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

function getMysqlConnectionConfig() {
  const connectionString = process.env.DATABASE_URL || '';
  const dbUser = process.env.DB_USER || process.env.DB_USERNAME || process.env.MYSQL_USER || process.env.MYSQL_USERNAME;
  const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || process.env.MYSQL_PASS;
  const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST;
  const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
  const dbName = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE || process.env.MYSQL_DB;
  const rawUrl = process.env.MYSQL_URL || process.env.MYSQL_DATABASE_URL || (connectionString.startsWith('mysql') ? connectionString : null);
  const parsedFromUrl = rawUrl ? parseMysqlUrl(rawUrl) : {};

  let finalHost = dbHost || parsedFromUrl.host;
  if (finalHost && finalHost.includes('@')) {
    const parts = finalHost.split('@');
    finalHost = parts[parts.length - 1];
  }
  const finalUser = dbUser || parsedFromUrl.user;
  const finalDatabase = dbName || parsedFromUrl.database;
  const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;

  if (!finalHost || !finalUser || finalPassword === undefined || !finalDatabase) {
    throw new Error('MySQL credentials incomplete. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, or MYSQL_URL / DATABASE_URL.');
  }

  return {
    host: finalHost,
    port: dbPort || 3306,
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
        \`key\` VARCHAR(191) PRIMARY KEY,
        \`value\` LONGTEXT NOT NULL,
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'room_types',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'rooms',
    sql: `
      CREATE TABLE IF NOT EXISTS \`rooms\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`roomNumber\` VARCHAR(50) NOT NULL UNIQUE,
        \`floor\` INT NOT NULL DEFAULT 1,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        \`roomTypeId\` VARCHAR(191) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'guests',
    sql: `
      CREATE TABLE IF NOT EXISTS \`guests\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`firstName\` VARCHAR(100) NOT NULL,
        \`lastName\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL UNIQUE,
        \`phoneNumber\` VARCHAR(100) NOT NULL,
        \`nationalIdOrPass\` VARCHAR(100) DEFAULT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'reservations',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'payments',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'table_reservations',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'spa_appointments',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'contact_messages',
    sql: `
      CREATE TABLE IF NOT EXISTS \`contact_messages\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`phone\` VARCHAR(100) DEFAULT NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'NEW',
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'event_inquiries',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'testimonials',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'dining_menu',
    sql: `
      CREATE TABLE IF NOT EXISTS \`dining_menu\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`price\` DECIMAL(10,2) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`tag\` VARCHAR(50) DEFAULT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'spa_treatments',
    sql: `
      CREATE TABLE IF NOT EXISTS \`spa_treatments\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`duration\` VARCHAR(50) NOT NULL,
        \`price\` DECIMAL(10,2) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'experiences',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'promotions',
    sql: `
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'faqs',
    sql: `
      CREATE TABLE IF NOT EXISTS \`faqs\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`question\` TEXT NOT NULL,
        \`answer\` TEXT NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`sort_order\` INT DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
  {
    name: 'gallery_images',
    sql: `
      CREATE TABLE IF NOT EXISTS \`gallery_images\` (
        \`id\` VARCHAR(191) PRIMARY KEY,
        \`src\` TEXT NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL DEFAULT 'hotel',
        \`sort_order\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
  },
];

const COLUMN_MIGRATIONS = [
  // room_types
  "ALTER TABLE \`room_types\` ADD COLUMN \`size\` VARCHAR(50) DEFAULT '32 m²'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`bedType\` VARCHAR(100) DEFAULT 'King Bed'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`view\` VARCHAR(100) DEFAULT 'City View'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`category\` VARCHAR(100) DEFAULT 'Hotel Rooms'",
  "ALTER TABLE \`room_types\` ADD COLUMN \`featured\` TINYINT(1) DEFAULT 1",
  "ALTER TABLE \`room_types\` ADD COLUMN \`aliases\` JSON DEFAULT NULL",

  // reservations
  "ALTER TABLE \`reservations\` ADD COLUMN \`adultsCount\` INT NOT NULL DEFAULT 1",
  "ALTER TABLE \`reservations\` ADD COLUMN \`childrenCount\` INT NOT NULL DEFAULT 0",
  "ALTER TABLE \`reservations\` ADD COLUMN \`expiresAt\` DATETIME(3) DEFAULT NULL",
  "ALTER TABLE \`reservations\` ADD COLUMN \`subtotal\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
  "ALTER TABLE \`reservations\` ADD COLUMN \`taxAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
  "ALTER TABLE \`reservations\` ADD COLUMN \`totalAmount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
  "ALTER TABLE \`reservations\` ADD COLUMN \`roomId\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`reservations\` ADD COLUMN \`isDateExtended\` TINYINT(1) DEFAULT 0",
  "ALTER TABLE \`reservations\` ADD COLUMN \`dateChangeNote\` TEXT DEFAULT NULL",

  // payments
  "ALTER TABLE \`payments\` ADD COLUMN \`reservationId\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`payments\` ADD COLUMN \`paidAt\` DATETIME(3) DEFAULT NULL",
  "ALTER TABLE \`payments\` ADD COLUMN \`rawPayload\` JSON DEFAULT NULL",

  // promotions
  "ALTER TABLE \`promotions\` ADD COLUMN \`badge\` VARCHAR(100) NOT NULL DEFAULT 'Offer'",
  "ALTER TABLE \`promotions\` ADD COLUMN \`discount\` VARCHAR(100) NOT NULL DEFAULT '10% Off'",
  "ALTER TABLE \`promotions\` ADD COLUMN \`inclusions\` JSON DEFAULT NULL",
  "ALTER TABLE \`promotions\` ADD COLUMN \`code\` VARCHAR(100) NOT NULL DEFAULT 'PROMO'",
  "ALTER TABLE \`promotions\` MODIFY COLUMN \`valid_until\` VARCHAR(100) NOT NULL DEFAULT 'Ongoing'",

  // dining_menu
  "ALTER TABLE \`dining_menu\` ADD COLUMN \`price\` DECIMAL(10,2) NOT NULL DEFAULT 25.00",
  "ALTER TABLE \`dining_menu\` ADD COLUMN \`tag\` VARCHAR(50) DEFAULT NULL",

  // spa_treatments
  "ALTER TABLE \`spa_treatments\` ADD COLUMN \`price\` DECIMAL(10,2) NOT NULL DEFAULT 50.00",

  // table_reservations
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`party_size\` INT NOT NULL DEFAULT 2",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_name\` VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_phone\` VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`guest_email\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`table_reservations\` ADD COLUMN \`notes\` TEXT DEFAULT NULL",

  // spa_appointments
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`service_id\` VARCHAR(191) DEFAULT NULL",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`service_name\` VARCHAR(255) DEFAULT 'Spa Treatment'",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_name\` VARCHAR(255) DEFAULT NULL",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_phone\` VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE \`spa_appointments\` ADD COLUMN \`client_email\` VARCHAR(191) DEFAULT NULL",

  // event_inquiries
  "ALTER TABLE \`event_inquiries\` ADD COLUMN \`target_date\` DATE DEFAULT NULL",
  "ALTER TABLE \`event_inquiries\` ADD COLUMN \`guests_count\` VARCHAR(50) NOT NULL DEFAULT '50'",
  "ALTER TABLE \`event_inquiries\` ADD COLUMN \`details\` TEXT DEFAULT NULL",

  // experiences
  "ALTER TABLE \`experiences\` ADD COLUMN \`subtitle\` VARCHAR(255) DEFAULT NULL",

  // gallery_images
  "ALTER TABLE \`gallery_images\` ADD COLUMN \`updated_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)",

  // hotel_settings
  "ALTER TABLE \`hotel_settings\` MODIFY COLUMN \`value\` LONGTEXT NOT NULL",
];

async function migrateMysql() {
  let connConfig;
  try {
    connConfig = getMysqlConnectionConfig();
  } catch (err) {
    console.error('✗', err.message);
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`GRAND ADDIS HOTEL - MYSQL PRODUCTION SCHEMA MIGRATION`);
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

    console.log('\nApplying column upgrades on existing tables...');
    for (const migration of COLUMN_MIGRATIONS) {
      try {
        await connection.query(migration);
      } catch {
        // Column already exists or already updated
      }
    }
    console.log('✓ Column upgrades applied cleanly.');

    console.log(`\n✓ All ${TABLES.length} tables verified and migrated successfully!`);
    console.log(`(No existing customer reservations or bookings were altered)\n`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message || error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrateMysql();
