import { createRedisClient } from './client';
import type { Redis } from 'ioredis';

export class RedisPubSub {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.publisher = createRedisClient();
    this.subscriber = createRedisClient();
  }

  async publish(channel: string, message: unknown): Promise<number> {
    return this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(msg));
        } catch {
          callback(msg);
        }
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }
}

export const pubsub = new RedisPubSub();
