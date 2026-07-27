export interface EfficiencyMetrics {
    computePerWatt: number;
    costPerCompute: number;
    carbonIntensity: number;
    availabilityScore: number;
    redundancyFactor: number;
}
export declare const calculateEfficiencyMetrics: (hashrate: number, powerWatts: number, operationalCostUSD: number, carbonEmissionsKg: number, uptimeHours: number, totalHours: number, redundancyNodes: number) => EfficiencyMetrics;
//# sourceMappingURL=efficiency.d.ts.map