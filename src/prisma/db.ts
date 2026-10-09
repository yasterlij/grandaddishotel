import 'dotenv/config';
import 'temporal-polyfill/global';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const globalForPrisma = globalThis as unknown as {
  prismaDb: ReturnType<typeof postgres<Contract>> | undefined;
};

const rawUrl = process.env['DATABASE_URL'] || '';
const isPostgresUrl = rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://');

export const db: ReturnType<typeof postgres<Contract>> | null =
  globalForPrisma.prismaDb ??
  (isPostgresUrl
    ? postgres<Contract>({
        contractJson,
        url: rawUrl,
      })
    : null);

if (process.env.NODE_ENV !== 'production' && db) {
  globalForPrisma.prismaDb = db;
}
