// Bestand: src/lib/prisma.ts

import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  // We gebruiken een lege string als fallback om TypeScript tevreden te houden tijdens build
  // Als de app echt start zonder DATABASE_URL, zal hij crashen bij connectie (wat goed is)
  const connectionString = process.env.DATABASE_URL || '';

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// De instantie wordt nu geëxporteerd als `dbCore`.
export const dbCore = globalThis.prismaGlobal ?? prismaClientSingleton();

// Export als default 'prisma' voor compatibiliteit met scripts
export const prisma = dbCore;
export default dbCore;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = dbCore;
}

export const disconnectDb = async () => {
  await dbCore.$disconnect();
};