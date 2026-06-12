import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ORACLE_PORT: z.string().transform(Number).default('8787'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  API_KEY: z.string().min(16).optional(),
  VITE_ORACLE_URL: z.string().url().optional()
});

export const env = envSchema.parse(process.env);
