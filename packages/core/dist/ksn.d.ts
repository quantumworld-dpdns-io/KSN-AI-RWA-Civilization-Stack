import type { InfrastructureAsset, KsnSnapshot } from "./types";
export declare function computeKsnScore(powerWatts: number, hashrate: number): number;
/**
 * Kardashev approximation:
 * K = (log10(P) - 6) / 10
 * where P is power in watts.
 */
export declare function estimateKardashevType(powerWatts: number): number;
export declare function classifyKardashevStage(kardashevType: number): string;
export declare function snapshotAsset(asset: InfrastructureAsset): KsnSnapshot;
//# sourceMappingURL=ksn.d.ts.map