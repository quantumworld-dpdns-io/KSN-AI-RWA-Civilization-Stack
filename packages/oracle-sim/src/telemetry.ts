import { SAMPLE_ASSETS, snapshotAsset, simulateYieldDistribution, estimateAutonomyRisk } from "@aks/core";

export function getAssetTelemetry(assetId: string) {
  const asset = SAMPLE_ASSETS.find((item) => item.id === assetId);
  if (!asset) return null;

  const jitter = deterministicJitter(assetId);
  const mutated = {
    ...asset,
    utilization: clamp01(asset.utilization + jitter * 0.05),
    powerWatts: asset.powerWatts * (1 + jitter * 0.02),
    hashrate: asset.hashrate * (1 + jitter * 0.03)
  };

  return {
    timestamp: new Date().toISOString(),
    asset: mutated,
    ksn: snapshotAsset(mutated),
    yieldDistribution: simulateYieldDistribution(mutated),
    autonomyRisk: estimateAutonomyRisk(mutated),
    oracleConfidence: clamp01(0.92 - mutated.riskScore * 0.35 + jitter * 0.03),
    telemetrySignature: `mock-signature-${Buffer.from(assetId).toString("hex").slice(0, 16)}`
  };
}

export function listTelemetry() {
  return SAMPLE_ASSETS.map((asset) => getAssetTelemetry(asset.id));
}

function deterministicJitter(input: string): number {
  let hash = 0;
  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return ((hash % 2000) / 1000 - 1) / 10;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
