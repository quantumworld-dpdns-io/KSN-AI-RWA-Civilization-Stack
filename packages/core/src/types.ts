export type AssetClass =
  | "MICROGRID_GPU_CLUSTER"
  | "PLANETARY_ENERGY_GRID"
  | "ORBITAL_SOLAR_ARRAY"
  | "ASTEROID_MINING_FLEET"
  | "DYSON_SWARM_NODE";

export type AgencyStage =
  | "HUMAN_OWNED"
  | "AI_MANAGED"
  | "AI_ISSUED"
  | "AI_CO_OWNED"
  | "SOVEREIGN_AI_ASSET"
  | "PLANETARY_AI_ALLOCATOR"
  | "KARDASHEV_CONVERGENCE";

export interface InfrastructureAsset {
  id: string;
  name: string;
  assetClass: AssetClass;
  powerWatts: number;
  hashrate: number;
  utilization: number;
  revenuePerComputeUnit: number;
  maintenanceCostRate: number;
  riskScore: number;
  agencyStage: AgencyStage;
}

export interface KsnSnapshot {
  assetId: string;
  powerWatts: number;
  hashrate: number;
  ksnScore: number;
  kardashevType: number;
  stageLabel: string;
}

export interface YieldDistribution {
  grossRevenue: number;
  maintenanceReserve: number;
  insurancePool: number;
  humanInvestorYield: number;
  aiTreasury: number;
  planetaryDividend: number;
  retainedForExpansion: number;
}

export interface AllocationPolicy {
  maintenanceReservePct: number;
  insurancePct: number;
  aiTreasuryPct: number;
  planetaryDividendPct: number;
  retainedExpansionPct: number;
}
