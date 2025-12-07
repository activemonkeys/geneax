// Bestand: src/lib/prisma.ts

// 1. Laad de variabelen uit .env in process.env
import 'dotenv/config';

// 2. Importeer je gevalideerde env object
import { env } from '@/env';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const prismaClientSingleton = () => {
  // 3. Gebruik nu env.DATABASE_URL in plaats van process.env.DATABASE_URL
  // Dit garandeert dat de URL bestaat en geldig is dankzij Zod
  const connectionString = env.DATABASE_URL;

  const pool = new Pool({
    connectionString,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === 'development' // Je kunt hier ook env.NODE_ENV gebruiken
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const dbCore = globalThis.prismaGlobal ?? prismaClientSingleton();
export const prisma = dbCore;
export default dbCore;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = dbCore;
}

export const disconnectDb = async () => {
  await dbCore.$disconnect();
};