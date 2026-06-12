export interface KardashevMetrics {
  extendedKardashevType: number;
  kardashevProgress: number; // 0 to 1
  civilizationEnergyCapacity: number; // Total energy budget in Watts
  civilizationComputeCapacity: number; // Total compute budget in FLOPS
}

export const calculateKardashevMetrics = (
  totalPowerWatts: number,
  totalHashrate: number
): KardashevMetrics => {
  // Base formula: K = (log10(P) - 6) / 10
  // Modified slightly to include compute weight as requested
  const baseK = totalPowerWatts > 0 ? (Math.log10(totalPowerWatts) - 6) / 10 : 0;
  const computeK = totalHashrate > 0 ? (Math.log10(totalHashrate) - 9) / 15 : 0;
  
  const extendedKardashevType = Math.max(0, (baseK * 0.7) + (computeK * 0.3));
  const kardashevProgress = extendedKardashevType % 1;

  return {
    extendedKardashevType,
    kardashevProgress,
    civilizationEnergyCapacity: totalPowerWatts,
    civilizationComputeCapacity: totalHashrate
  };
};
