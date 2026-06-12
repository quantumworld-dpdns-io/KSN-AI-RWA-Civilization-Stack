import { getRedisClient } from './client';

export interface TelemetryData {
  id: string;
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export class TelemetryStore {
  private client = getRedisClient();

  async addTelemetry(sensorId: string, data: TelemetryData): Promise<void> {
    const key = `telemetry:${sensorId}`;
    const stringified = JSON.stringify(data);
    
    // Add to sorted set with timestamp as score
    await this.client.zadd(key, data.timestamp, stringified);
  }

  async getTelemetryRange(sensorId: string, startTs: number, endTs: number): Promise<TelemetryData[]> {
    const key = `telemetry:${sensorId}`;
    const results = await this.client.zrangebyscore(key, startTs, endTs);
    
    return results.map(res => JSON.parse(res) as TelemetryData);
  }
}

export const telemetryStore = new TelemetryStore();
