import 'dotenv/config';
import 'temporal-polyfill/global';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const globalForPrisma = globalThis as unknown as {
  prismaDb: ReturnType<typeof postgres<Contract>> | undefined;
};

export const db =
  globalForPrisma.prismaDb ??
  postgres<Contract>({
    contractJson,
    url: process.env['DATABASE_URL'] || 'postgresql://tamrat@localhost:5432/grand_addis_db',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaDb = db;
}
