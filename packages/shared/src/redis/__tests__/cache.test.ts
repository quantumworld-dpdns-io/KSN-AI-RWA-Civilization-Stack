import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCache } from '../cache';

const mocks = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
}));

vi.mock('../client', () => {
  return {
    getRedisClient: vi.fn(() => ({
      get: mocks.mockGet,
      set: mocks.mockSet,
      del: mocks.mockDel,
    })),
  };
});

describe('RedisCache', () => {
  let cache: RedisCache;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = new RedisCache();
  });

  it('gets a value and parses it', async () => {
    mocks.mockGet.mockResolvedValueOnce(JSON.stringify({ hello: 'world' }));
    const result = await cache.get('test-key');
    expect(mocks.mockGet).toHaveBeenCalledWith('test-key');
    expect(result).toEqual({ hello: 'world' });
  });

  it('returns null if key does not exist', async () => {
    mocks.mockGet.mockResolvedValueOnce(null);
    const result = await cache.get('test-key');
    expect(result).toBeNull();
  });

  it('sets a value without ttl', async () => {
    await cache.set('test-key', { foo: 'bar' });
    expect(mocks.mockSet).toHaveBeenCalledWith('test-key', JSON.stringify({ foo: 'bar' }));
  });

  it('sets a value with ttl', async () => {
    await cache.set('test-key', { foo: 'bar' }, 60);
    expect(mocks.mockSet).toHaveBeenCalledWith('test-key', JSON.stringify({ foo: 'bar' }), 'EX', 60);
  });

  it('invalidates a key', async () => {
    await cache.invalidate('test-key');
    expect(mocks.mockDel).toHaveBeenCalledWith('test-key');
  });
});
