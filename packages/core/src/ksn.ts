import type { InfrastructureAsset, KsnSnapshot } from "./types";

export function computeKsnScore(powerWatts: number, hashrate: number): number {
  if (!Number.isFinite(powerWatts) || powerWatts < 0) {
    throw new Error("powerWatts must be a non-negative finite number");
  }
  if (!Number.isFinite(hashrate) || hashrate <= 0) {
    throw new Error("hashrate must be a positive finite number");
  }
  return powerWatts / hashrate;
}

/**
 * Kardashev approximation:
 * K = (log10(P) - 6) / 10
 * where P is power in watts.
 */
export function estimateKardashevType(powerWatts: number): number {
  if (!Number.isFinite(powerWatts) || powerWatts <= 0) {
    throw new Error("powerWatts must be positive");
  }
  return (Math.log10(powerWatts) - 6) / 10;
}

export function classifyKardashevStage(kardashevType: number): string {
  if (kardashevType < 0.8) return "Type 0.x — pre-planetary DePIN / regional infrastructure";
  if (kardashevType < 1.2) return "Type 1.0 — planetary energy-compute infrastructure";
  if (kardashevType < 2.0) return "Type 1.x — interplanetary infrastructure transition";
  if (kardashevType < 2.4) return "Type 2.0 — stellar energy capture infrastructure";
  return "Type 2+ — speculative stellar-scale civilization infrastructure";
}

export function snapshotAsset(asset: InfrastructureAsset): KsnSnapshot {
  const ksnScore = computeKsnScore(asset.powerWatts, asset.hashrate);
  const kardashevType = estimateKardashevType(asset.powerWatts);

  return {
    assetId: asset.id,
    powerWatts: asset.powerWatts,
    hashrate: asset.hashrate,
    ksnScore,
    kardashevType,
    stageLabel: classifyKardashevStage(kardashevType)
  };
}
