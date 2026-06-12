import { DuckDBClient } from './duckdb';

export class LakehouseMetrics {
  constructor(private client: DuckDBClient) {}

  async getIngestionRate() {
    const sql = `
      SELECT 
        COUNT(*) / 60 as records_per_min
      FROM telemetry 
      WHERE timestamp >= now() - INTERVAL 1 MINUTE
    `;
    // DuckDB might not support now() in all versions, depends on config
    return this.client.runQuery(sql);
  }

  async getDataCompleteness(assetId: string) {
    const sql = `
      SELECT 
        metricName,
        COUNT(*) as count
      FROM telemetry
      WHERE assetId = ?
      GROUP BY metricName
    `;
    return this.client.runQuery(sql, [assetId]);
  }
}
