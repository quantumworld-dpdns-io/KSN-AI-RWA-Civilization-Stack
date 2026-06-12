import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DuckDBClient } from '../duckdb';

describe('DuckDBClient', () => {
  let client: DuckDBClient;

  beforeEach(async () => {
    client = new DuckDBClient({ databasePath: ':memory:' });
    await client.init();
  });

  afterEach(async () => {
    await client.close();
  });

  it('should insert and query telemetry', async () => {
    const data = [
      {
        timestamp: new Date(),
        assetId: 'asset-1',
        metricName: 'ksn_score',
        value: 0.85,
        metadata: { version: '1.0' }
      }
    ];

    await client.insertTelemetry(data);
    const results = await client.query({ assetId: 'asset-1' });

    expect(results).toHaveLength(1);
    expect(results[0].assetId).toBe('asset-1');
    expect(results[0].value).toBe(0.85);
  });
});
