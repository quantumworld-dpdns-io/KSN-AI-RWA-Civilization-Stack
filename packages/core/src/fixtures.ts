import type { InfrastructureAsset } from "./types";

export const SAMPLE_ASSETS: InfrastructureAsset[] = [
  {
    id: "type-07-taipei-microgrid-gpu",
    name: "Type 0.7 Taipei Microgrid GPU Cluster",
    assetClass: "MICROGRID_GPU_CLUSTER",
    powerWatts: 8.5e6,
    hashrate: 4.2e14,
    utilization: 0.71,
    revenuePerComputeUnit: 1.4e-15,
    maintenanceCostRate: 0.09,
    riskScore: 0.22,
    agencyStage: "AI_MANAGED"
  },
  {
    id: "type-10-planetary-grid-dao",
    name: "Type 1.0 Planetary Energy Grid DAO",
    assetClass: "PLANETARY_ENERGY_GRID",
    powerWatts: 1.0e16,
    hashrate: 8.0e22,
    utilization: 0.83,
    revenuePerComputeUnit: 2.2e-22,
    maintenanceCostRate: 0.05,
    riskScore: 0.46,
    agencyStage: "PLANETARY_AI_ALLOCATOR"
  },
  {
    id: "type-20-orbital-solar-array",
    name: "Type 2.0 Orbital Solar Array / Dyson Swarm Node",
    assetClass: "ORBITAL_SOLAR_ARRAY",
    powerWatts: 3.8e26,
    hashrate: 2.6e33,
    utilization: 0.91,
    revenuePerComputeUnit: 3.5e-33,
    maintenanceCostRate: 0.03,
    riskScore: 0.68,
    agencyStage: "KARDASHEV_CONVERGENCE"
  }
];
