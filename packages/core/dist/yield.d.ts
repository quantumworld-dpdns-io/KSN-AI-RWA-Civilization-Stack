import type { AllocationPolicy, InfrastructureAsset, YieldDistribution } from "./types";
export declare const DEFAULT_POLICY: AllocationPolicy;
export declare function validatePolicy(policy: AllocationPolicy): void;
export declare function simulateGrossRevenue(asset: InfrastructureAsset, epochHours?: number): number;
export declare function simulateYieldDistribution(asset: InfrastructureAsset, policy?: AllocationPolicy, epochHours?: number): YieldDistribution;
//# sourceMappingURL=yield.d.ts.map