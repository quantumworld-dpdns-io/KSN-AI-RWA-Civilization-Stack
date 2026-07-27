export const calculateEfficiencyMetrics = (hashrate, powerWatts, operationalCostUSD, carbonEmissionsKg, uptimeHours, totalHours, redundancyNodes) => {
    return {
        computePerWatt: powerWatts > 0 ? hashrate / powerWatts : 0,
        costPerCompute: hashrate > 0 ? operationalCostUSD / hashrate : 0,
        carbonIntensity: powerWatts > 0 ? carbonEmissionsKg / (powerWatts / 1000) : 0,
        availabilityScore: totalHours > 0 ? Math.min(1, Math.max(0, uptimeHours / totalHours)) : 0,
        redundancyFactor: Math.max(0, redundancyNodes),
    };
};
//# sourceMappingURL=efficiency.js.map