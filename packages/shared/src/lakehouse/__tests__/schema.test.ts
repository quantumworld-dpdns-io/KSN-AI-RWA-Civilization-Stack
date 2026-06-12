import { describe, it, expect } from 'vitest';
import { TelemetryRecordSchema } from '../schema';

describe('Telemetry Schema', () => {
  it('should validate correct telemetry records', () => {
    const record = {
      timestamp: new Date(),
      assetId: 'asset-1',
      metricName: 'power_watts',
      value: 1500,
      metadata: { source: 'iot-sensor' }
    };

    const result = TelemetryRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it('should reject invalid records', () => {
    const record = {
      timestamp: 'invalid-date',
      assetId: 123,
      metricName: 'power_watts',
      value: 'not-a-number'
    };

    const result = TelemetryRecordSchema.safeParse(record);
    expect(result.success).toBe(false);
  });
});
