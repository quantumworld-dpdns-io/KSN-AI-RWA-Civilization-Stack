import { DuckDBClient } from './duckdb';
import { TelemetrySchema } from './types';
import { TelemetryRecordSchema } from './schema';

export class IngestionPipeline {
  constructor(private client: DuckDBClient) {}

  async processBatch(batch: any[]) {
    const validated: TelemetrySchema[] = [];
    
    for (const item of batch) {
      try {
        const result = TelemetryRecordSchema.parse(item);
        validated.push(result);
      } catch (e) {
        console.error('Invalid telemetry record:', e);
      }
    }

    if (validated.length > 0) {
      await this.client.insertTelemetry(validated);
    }
  }

  async processStream(stream: AsyncIterable<any>) {
    let batch: any[] = [];
    const BATCH_SIZE = 100;

    for await (const item of stream) {
      batch.push(item);
      if (batch.length >= BATCH_SIZE) {
        await this.processBatch(batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.processBatch(batch);
    }
  }
}
