import { getRedisClient } from './client';

export class RedisCache {
  private client = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const stringified = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, stringified, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, stringified);
    }
  }

  async invalidate(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export const cache = new RedisCache();
