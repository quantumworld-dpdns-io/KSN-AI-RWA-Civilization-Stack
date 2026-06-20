import type { Redis } from "ioredis";
import { getRedisClient } from "./redis";
import type { AssetTelemetry } from "./telemetry";

export interface TelemetryStore {
  ping(): Promise<boolean>;
  save(snapshot: AssetTelemetry): Promise<void>;
  current(assetId: string): Promise<AssetTelemetry | null>;
  history(assetId: string, limit: number): Promise<AssetTelemetry[]>;
}

export class RedisTelemetryStore implements TelemetryStore {
  constructor(
    private readonly client: Redis = getRedisClient(),
    private readonly historyLimit = positiveInteger(process.env.TELEMETRY_HISTORY_LIMIT, 500),
    private readonly currentTtlSeconds = positiveInteger(process.env.TELEMETRY_CACHE_TTL_SECONDS, 300)
  ) {}

  async ping(): Promise<boolean> {
    if (this.client.status === "wait") await this.client.connect();
    return (await this.client.ping()) === "PONG";
  }

  async save(snapshot: AssetTelemetry): Promise<void> {
    const currentKey = `aks:oracle:current:${snapshot.asset.id}`;
    const historyKey = `aks:oracle:history:${snapshot.asset.id}`;
    const payload = JSON.stringify(snapshot);
    const score = Date.parse(snapshot.timestamp);
    const transaction = this.client
      .multi()
      .set(currentKey, payload, "EX", this.currentTtlSeconds)
      .zadd(historyKey, score, payload)
      .zremrangebyrank(historyKey, 0, -(this.historyLimit + 1))
      .sadd("aks:oracle:assets", snapshot.asset.id);
    const result = await transaction.exec();
    if (!result) throw new Error("Redis telemetry transaction was aborted");
  }

  async current(assetId: string): Promise<AssetTelemetry | null> {
    const value = await this.client.get(`aks:oracle:current:${assetId}`);
    return value ? parseSnapshot(value) : null;
  }

  async history(assetId: string, limit: number): Promise<AssetTelemetry[]> {
    const values = await this.client.zrevrange(`aks:oracle:history:${assetId}`, 0, Math.max(0, limit - 1));
    return values.map(parseSnapshot);
  }
}

function parseSnapshot(value: string): AssetTelemetry {
  return JSON.parse(value) as AssetTelemetry;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
