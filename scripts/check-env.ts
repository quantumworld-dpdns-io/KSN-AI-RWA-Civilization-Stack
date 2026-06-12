import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ORACLE_PORT: z.string().transform(Number).default('8787'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().min(1, 'REDIS_PASSWORD is required'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  API_KEY: z.string().min(16, 'API_KEY must be at least 16 characters'),
});

try {
  envSchema.parse(process.env);
  console.log('Environment variables validated successfully.');
  process.exit(0);
} catch (error: any) {
  console.error('Environment variable validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach(e => {
      console.error(`- ${e.path.join('.')}: ${e.message}`);
    });
  } else {
    console.error(error);
  }
  process.exit(1);
}
