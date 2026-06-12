import { describe, it, expect, vi } from 'vitest';
import { createRedisClient, getRedisClient } from '../client';
import { Redis } from 'ioredis';

vi.mock('ioredis', () => {
  const RedisMock = vi.fn();
  return { Redis: RedisMock };
});

describe('Redis Client', () => {
  it('creates a new client with default options', () => {
    const client = createRedisClient();
    expect(Redis).toHaveBeenCalled();
    expect(client).toBeDefined();
  });

  it('reuses the same client instance when calling getRedisClient multiple times', () => {
    const client1 = getRedisClient();
    const client2 = getRedisClient();
    expect(client1).toBe(client2);
  });
});
