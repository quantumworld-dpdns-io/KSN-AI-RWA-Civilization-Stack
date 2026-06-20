import type { AgencyStage, InfrastructureAsset, KsnSnapshot, YieldDistribution } from "@aks/core";

export interface OracleSignals {
  energySource: string;
  computeArchitecture: string;
  networkTopology: string;
  region: string;
  complianceStatus: string;
  maintenanceCostRate: number;
  carbonIntensityKgCo2ePerKwh: number;
  geopoliticalRiskScore: number;
  legalRiskScore: number;
  aggregateRiskScore: number;
}

export interface AgencyModel {
  stage: AgencyStage;
  stageIndex: number;
  description: string;
  nextStage: AgencyStage;
  operatingPolicy: {
    dynamicPriceMultiplier: number;
    routeToLowestCarbonEnergy: boolean;
    reserveMaintenanceCapital: boolean;
    mayIssueExpansionClaims: boolean;
    mayAcquireOwnership: boolean;
    distributesCivilizationDividend: boolean;
  };
  safetyControls: {
    externalExecutionEnabled: false;
    killSwitchAvailable: boolean;
    humanApprovalRequiredForIssuanceAndOwnership: boolean;
    maxDynamicPriceMultiplier: number;
  };
}

export interface AssetTelemetry {
  timestamp: string;
  asset: InfrastructureAsset;
  ksn: KsnSnapshot;
  yieldDistribution: YieldDistribution;
  autonomyRisk: number;
  oracleConfidence: number;
  signals: OracleSignals;
  agency: AgencyModel;
  payloadHash: string;
  signatureAlgorithm: string;
  telemetrySignature: string;
}

export interface ServiceHealth {
  oracle: "online" | "offline";
  redis: "connected" | "offline" | "unknown";
  signing: "configured" | "development-key" | "unknown";
  checkedAt: string;
  message?: string;
}

export interface OracleCapabilities {
  service: string;
  persistence: string;
  sqlPersistence: boolean;
  telemetry: string[];
  calculations: string[];
  integrity: string[];
  endpoints: string[];
}

export interface TelemetryHistory {
  assetId: string;
  count: number;
  items: AssetTelemetry[];
}

export interface SimulationResult extends AssetTelemetry {
  input: { powerWatts: number; hashrate: number; utilization: number };
  ksnScore: number;
  note: string;
  signatureValid: boolean;
}
