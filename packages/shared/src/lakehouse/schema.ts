import { z } from 'zod';

export const TelemetryRecordSchema = z.object({
  timestamp: z.date(),
  assetId: z.string(),
  metricName: z.string(),
  value: z.number(),
  metadata: z.record(z.any()).optional(),
});

export type TelemetryRecord = z.infer<typeof TelemetryRecordSchema>;

export const AggregationSchema = z.object({
  assetId: z.string(),
  avgValue: z.number(),
  maxValue: z.number(),
  minValue: z.number(),
  count: z.number(),
});
