import duckdb from 'duckdb';
import { promisify } from 'util';
import { LakehouseConfig, QueryOptions, TelemetrySchema } from './types';

export class DuckDBClient {
  private db: duckdb.Database;
  private conn: duckdb.Connection;

  constructor(config: LakehouseConfig = {}) {
    this.db = new duckdb.Database(config.databasePath || ':memory:');
    this.conn = this.db.connect();
  }

  async init() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS telemetry (
        timestamp TIMESTAMP,
        assetId VARCHAR,
        metricName VARCHAR,
        value DOUBLE,
        metadata JSON
      )
    `);
  }

  async insertTelemetry(data: TelemetrySchema[]) {
    const stmt = this.db.prepare('INSERT INTO telemetry VALUES (?, ?, ?, ?, ?)');
    for (const row of data) {
      await new Promise<void>((resolve, reject) => {
        stmt.run(
          row.timestamp,
          row.assetId,
          row.metricName,
          row.value,
          JSON.stringify(row.metadata || {}),
          (err) => (err ? reject(err) : resolve())
        );
      });
    }
    stmt.finalize();
  }

  async query(options: QueryOptions): Promise<any[]> {
    let sql = 'SELECT * FROM telemetry WHERE 1=1';
    const params: any[] = [];

    if (options.startTime) {
      sql += ' AND timestamp >= ?';
      params.push(options.startTime);
    }
    if (options.endTime) {
      sql += ' AND timestamp <= ?';
      params.push(options.endTime);
    }
    if (options.assetId) {
      sql += ' AND assetId = ?';
      params.push(options.assetId);
    }
    if (options.metricName) {
      sql += ' AND metricName = ?';
      params.push(options.metricName);
    }

    sql += ' ORDER BY timestamp DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    return new Promise((resolve, reject) => {
      this.conn.all(sql, ...params, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  private run(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn.run(sql, (err) => (err ? reject(err) : resolve()));
    });
  }

  async close() {
    this.conn.close();
  }
}
