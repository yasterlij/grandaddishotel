import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import mysql from 'mysql2/promise';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables in priority order
for (const envFile of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  const envPath = path.join(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Sanitize host variables at process level
function sanitizeEnvHost(envKey) {
  const raw = process.env[envKey];
  if (!raw) return;
  let host = raw.trim();
  if (host.includes('@')) {
    host = host.split('@').pop().trim();
  }
  if (host.includes(':')) {
    const [h, p] = host.split(':');
    host = h.trim();
    if (!process.env.DB_PORT && !process.env.MYSQL_PORT && !process.env.PGPORT) {
      const port = parseInt(p, 10);
      if (!isNaN(port) && port > 0 && port < 65536) {
        if (envKey.startsWith('PG')) {
          process.env.PGPORT = String(port);
        } else {
          process.env.DB_PORT = String(port);
        }
      }
    }
  }
  if (host.toLowerCase() === 'localhost') {
    host = '127.0.0.1';
  }
  process.env[envKey] = host;
}

sanitizeEnvHost('DB_HOST');
sanitizeEnvHost('MYSQL_HOST');
sanitizeEnvHost('PGHOST');
sanitizeEnvHost('POSTGRES_HOST');

export const connectionString =
  process.env.DATABASE_URL || 'postgresql://tamrat@localhost:5432/grand_addis_db';

export const isMysql = Boolean(
  (
    process.env.DB_TYPE === 'mysql' ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_DATABASE_URL ||
    connectionString.startsWith('mysql://') ||
    connectionString.startsWith('mysql:') ||
    ((process.env.DB_HOST || process.env.DB_USER || process.env.MYSQL_USER) &&
      !connectionString.startsWith('postgres://') &&
      !connectionString.startsWith('postgresql://'))
  ) &&
    process.env.DB_TYPE !== 'postgres' &&
    process.env.DB_TYPE !== 'postgresql'
);

export function parsePostgresUrl(rawUrl) {
  try {
    const withoutScheme = (rawUrl || '').replace(/^postgres(?:ql)?:\/\//i, '');
    const slashIdx = withoutScheme.indexOf('/');
    const pathAndQuery = slashIdx !== -1 ? withoutScheme.slice(slashIdx + 1) : '';
    const hostAndAuth = slashIdx !== -1 ? withoutScheme.slice(0, slashIdx) : withoutScheme;

    const [dbPart, queryPart] = pathAndQuery.split('?');
    let database = dbPart ? decodeURIComponent(dbPart) : undefined;
    const ssl = queryPart ? /sslmode=require/i.test(queryPart) : false;

    const lastAtIdx = hostAndAuth.lastIndexOf('@');
    let user;
    let password;
    let host = '127.0.0.1';
    let port = 5432;

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

    if (host.includes('@')) {
      host = host.split('@').pop().trim();
    }
    if (host.toLowerCase() === 'localhost') {
      host = '127.0.0.1';
    }

    if (process.env.PGHOST) {
      let envH = process.env.PGHOST.trim();
      if (envH.includes('@')) envH = envH.split('@').pop().trim();
      if (envH.toLowerCase() === 'localhost') envH = '127.0.0.1';
      host = envH;
    }
    if (process.env.PGPORT) {
      const p = parseInt(process.env.PGPORT, 10);
      if (!isNaN(p)) port = p;
    }
    if (process.env.PGUSER) user = process.env.PGUSER;
    if (process.env.PGPASSWORD) password = process.env.PGPASSWORD;
    if (process.env.PGDATABASE) database = process.env.PGDATABASE;

    return {
      user,
      password,
      host: host || '127.0.0.1',
      port: isNaN(port) ? 5432 : port,
      database,
      ssl,
    };
  } catch {
    return { host: '127.0.0.1', port: 5432 };
  }
}

export function createPgPool() {
  const pgParsed = parsePostgresUrl(connectionString);
  return new Pool({
    host: pgParsed.host,
    port: pgParsed.port,
    user: pgParsed.user,
    password: pgParsed.password,
    database: pgParsed.database,
    ssl: pgParsed.ssl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export function sanitizeHostAndPort(rawHost, rawPort) {
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

export function parseMysqlUrl(rawUrl) {
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

export function getMysqlConnectionConfig() {
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
  const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST;
  const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
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

  const { host: finalHost, port: finalPort } = sanitizeHostAndPort(
    dbHost || parsedFromUrl.host,
    !isNaN(dbPort) && process.env.DB_PORT ? dbPort : parsedFromUrl.port || dbPort
  );
  const finalUser = dbUser || parsedFromUrl.user;
  const finalDatabase = dbName || parsedFromUrl.database;
  const finalPassword = dbPassword !== undefined ? dbPassword : parsedFromUrl.password;

  if (!finalHost || !finalUser || finalPassword === undefined || !finalDatabase) {
    throw new Error(
      'MySQL credentials incomplete. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME, or MYSQL_URL / DATABASE_URL.'
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
