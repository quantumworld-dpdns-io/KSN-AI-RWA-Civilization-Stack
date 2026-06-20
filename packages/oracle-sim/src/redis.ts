import { Redis, type RedisOptions } from "ioredis";

const DEFAULT_OPTIONS: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
};

let clientInstance: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!clientInstance) {
    clientInstance = new Redis(DEFAULT_OPTIONS);
  }
  return clientInstance;
};
