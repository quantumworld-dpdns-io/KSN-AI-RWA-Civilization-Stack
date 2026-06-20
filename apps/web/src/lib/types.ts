import type { InfrastructureAsset, KsnSnapshot, YieldDistribution } from "@aks/core";

export interface AssetTelemetry {
  timestamp: string;
  asset: InfrastructureAsset;
  ksn: KsnSnapshot;
  yieldDistribution: YieldDistribution;
  autonomyRisk: number;
  oracleConfidence: number;
  telemetrySignature: string;
}

export interface ServiceHealth {
  oracle: "online" | "offline";
  redis: "connected" | "offline" | "unknown";
  checkedAt: string;
  message?: string;
}

export interface SimulationResult {
  timestamp: string;
  input: { powerWatts: number; hashrate: number; utilization: number };
  ksnScore: number;
  note: string;
}
