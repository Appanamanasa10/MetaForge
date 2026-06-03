import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db;

