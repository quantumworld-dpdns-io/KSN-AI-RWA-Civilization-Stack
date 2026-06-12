import { Redis, type RedisOptions } from 'ioredis';

const DEFAULT_OPTIONS: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    // Connection pooling & retry logic
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

let clientInstance: Redis | null = null;

export const createRedisClient = (options: Partial<RedisOptions> = {}): Redis => {
  return new Redis({ ...DEFAULT_OPTIONS, ...options });
};

export const getRedisClient = (): Redis => {
  if (!clientInstance) {
    clientInstance = createRedisClient();
  }
  return clientInstance;
};
