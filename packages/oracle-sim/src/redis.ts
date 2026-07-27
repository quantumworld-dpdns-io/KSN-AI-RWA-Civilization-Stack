import { Redis, type RedisOptions } from "ioredis";

let clientInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!clientInstance) clientInstance = new Redis(redisOptions());
  return clientInstance;
}

export async function closeRedisClient(): Promise<void> {
  if (!clientInstance) return;
  const client = clientInstance;
  clientInstance = null;
  await client.quit();
}

function redisOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parsePositiveInteger(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: parsePositiveInteger(process.env.REDIS_CONNECT_TIMEOUT_MS, 2_000),
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 1_000)
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
