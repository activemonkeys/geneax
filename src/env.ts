// src/env.ts
import {createEnv} from '@t3-oss/env-nextjs';
import {z} from 'zod';

export const env = createEnv({
  /*
   * Server-side omgevingsvariabelen (niet beschikbaar in de browser).
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),
  },

  /*
   * Client-side variabelen (moeten beginnen met NEXT_PUBLIC_).
   * Heb je die nog niet? Laat dit dan leeg object.
   */
  client: {
    // NEXT_PUBLIC_API_URL: z.string().url(),
  },

  /*
   * Dit zorgt ervoor dat de variabelen aan de validator worden doorgegeven.
   * Voor Next.js >= 13.4.4 hoef je alleen process.env mee te geven.
   */
  experimental__runtimeEnv: process.env,
});
