export interface TelemetryReport {
  assetId: string;
  metricName: string;
  value: number;
  timestamp: Date;
  sourceId: string;
  signature?: string;
}

export interface OracleSource {
  id: string;
  type: 'HTTP' | 'MQTT' | 'GRPC' | 'SATELLITE';
  fetch(): Promise<TelemetryReport[]>;
}

export interface OracleAggregation {
  assetId: string;
  metricName: string;
  medianValue: number;
  confidenceScore: number;
  timestamp: Date;
  sources: string[];
}
