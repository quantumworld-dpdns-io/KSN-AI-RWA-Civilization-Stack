export interface EfficiencyMetrics {
  computePerWatt: number; // Operations per watt
  costPerCompute: number; // USD per TFLOPS
  carbonIntensity: number; // kgCO2 per kWh
  availabilityScore: number; // Uptime percentage 0-1
  redundancyFactor: number; // 0 for none, 1 for N+1, 2 for N+2, etc.
}

export const calculateEfficiencyMetrics = (
  hashrate: number,
  powerWatts: number,
  operationalCostUSD: number,
  carbonEmissionsKg: number,
  uptimeHours: number,
  totalHours: number,
  redundancyNodes: number
): EfficiencyMetrics => {
  return {
    computePerWatt: powerWatts > 0 ? hashrate / powerWatts : 0,
    costPerCompute: hashrate > 0 ? operationalCostUSD / hashrate : 0,
    carbonIntensity: powerWatts > 0 ? carbonEmissionsKg / (powerWatts / 1000) : 0,
    availabilityScore: totalHours > 0 ? Math.min(1, Math.max(0, uptimeHours / totalHours)) : 0,
    redundancyFactor: Math.max(0, redundancyNodes),
  };
};
