import type { AllocationPolicy, InfrastructureAsset, YieldDistribution } from "./types";

export const DEFAULT_POLICY: AllocationPolicy = {
  maintenanceReservePct: 0.18,
  insurancePct: 0.07,
  aiTreasuryPct: 0.15,
  planetaryDividendPct: 0.05,
  retainedExpansionPct: 0.10
};

export function validatePolicy(policy: AllocationPolicy): void {
  const total =
    policy.maintenanceReservePct +
    policy.insurancePct +
    policy.aiTreasuryPct +
    policy.planetaryDividendPct +
    policy.retainedExpansionPct;

  if (total > 0.95) {
    throw new Error(`policy reserves too much value: ${total}`);
  }

  for (const [key, value] of Object.entries(policy)) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`${key} must be between 0 and 1`);
    }
  }
}

export function simulateGrossRevenue(asset: InfrastructureAsset, epochHours = 24): number {
  const computeSold = asset.hashrate * asset.utilization * epochHours;
  return computeSold * asset.revenuePerComputeUnit;
}

export function simulateYieldDistribution(
  asset: InfrastructureAsset,
  policy: AllocationPolicy = DEFAULT_POLICY,
  epochHours = 24
): YieldDistribution {
  validatePolicy(policy);
  const grossRevenue = simulateGrossRevenue(asset, epochHours);
  const maintenanceReserve = grossRevenue * policy.maintenanceReservePct + grossRevenue * asset.maintenanceCostRate;
  const insurancePool = grossRevenue * policy.insurancePct;
  const aiTreasury = grossRevenue * policy.aiTreasuryPct;
  const planetaryDividend = grossRevenue * policy.planetaryDividendPct;
  const retainedForExpansion = grossRevenue * policy.retainedExpansionPct;

  const humanInvestorYield = Math.max(
    0,
    grossRevenue - maintenanceReserve - insurancePool - aiTreasury - planetaryDividend - retainedForExpansion
  );

  return {
    grossRevenue,
    maintenanceReserve,
    insurancePool,
    humanInvestorYield,
    aiTreasury,
    planetaryDividend,
    retainedForExpansion
  };
}
