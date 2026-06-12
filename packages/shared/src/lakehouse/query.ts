import { DuckDBClient } from './duckdb';
import { QueryOptions } from './types';

export class LakehouseQueryBuilder {
  constructor(private client: DuckDBClient) {}

  async getAverageMetric(metricName: string, assetId?: string) {
    let sql = `SELECT AVG(value) as avgValue FROM telemetry WHERE metricName = ?`;
    const params: any[] = [metricName];

    if (assetId) {
      sql += ` AND assetId = ?`;
      params.push(assetId);
    }

    return this.client.query({} as any); // Simplified for now
  }

  async getTimeSeries(metricName: string, assetId: string, limit = 100) {
    return this.client.query({
      metricName,
      assetId,
      limit
    });
  }

  async getKsnSummary() {
    const sql = `
      SELECT 
        assetId, 
        AVG(value) as avg_ksn,
        MAX(value) as max_ksn,
        MIN(value) as min_ksn,
        COUNT(*) as samples
      FROM telemetry 
      WHERE metricName = 'ksn_score'
      GROUP BY assetId
    `;
    // We would need a more flexible query method in DuckDBClient to run arbitrary SQL
    return this.client.query({} as any); 
  }
}
