export interface LakehouseConfig {
  databasePath?: string; // ":memory:" for in-memory
}

export interface TelemetrySchema {
  timestamp: Date;
  assetId: string;
  metricName: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface QueryOptions {
  startTime?: Date;
  endTime?: Date;
  assetId?: string;
  metricName?: string;
  limit?: number;
}
