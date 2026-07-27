import type { AgencyModel, AssetTelemetry, OracleSignals } from "./types";

const DEFAULT_SIGNALS: OracleSignals = {
  energySource: "UNKNOWN",
  computeArchitecture: "UNKNOWN",
  networkTopology: "UNKNOWN",
  region: "UNKNOWN",
  complianceStatus: "PENDING_REVIEW",
  maintenanceCostRate: 0,
  carbonIntensityKgCo2ePerKwh: 0,
  geopoliticalRiskScore: 0,
  legalRiskScore: 0,
  aggregateRiskScore: 0
};

const DEFAULT_AGENCY: AgencyModel = {
  stage: "HUMAN_OWNED" as AgencyModel["stage"],
  stageIndex: 0,
  description: "Agency model unavailable for this snapshot.",
  nextStage: "HUMAN_OWNED" as AgencyModel["stage"],
  operatingPolicy: {
    dynamicPriceMultiplier: 1,
    routeToLowestCarbonEnergy: false,
    reserveMaintenanceCapital: false,
    mayIssueExpansionClaims: false,
    mayAcquireOwnership: false,
    distributesCivilizationDividend: false
  },
  safetyControls: {
    externalExecutionEnabled: false,
    killSwitchAvailable: true,
    humanApprovalRequiredForIssuanceAndOwnership: true,
    maxDynamicPriceMultiplier: 1.5
  }
};

const DEFAULT_YIELD = {
  grossRevenue: 0,
  humanInvestorYield: 0,
  aiTreasury: 0,
  maintenanceReserve: 0,
  insurancePool: 0,
  retainedForExpansion: 0,
  planetaryDividend: 0
};

/**
 * The live Oracle API can return telemetry items that omit nested objects
 * (signals/agency/yieldDistribution/ksn). Rendering those directly crashes the
 * dashboard (e.g. reading `signals.complianceStatus` of undefined). This fills
 * any missing structure with safe defaults so the UI can always render.
 */
export function normalizeTelemetry(raw: Partial<AssetTelemetry> | null | undefined): AssetTelemetry {
  const item = (raw ?? {}) as Partial<AssetTelemetry>;
  return {
    timestamp: item.timestamp ?? new Date().toISOString(),
    asset: item.asset as AssetTelemetry["asset"],
    ksn: { kardashevType: 0, ksnScore: 0, stageLabel: "Unavailable", ...(item.ksn ?? {}) } as AssetTelemetry["ksn"],
    yieldDistribution: { ...DEFAULT_YIELD, ...(item.yieldDistribution ?? {}) },
    autonomyRisk: item.autonomyRisk ?? 0,
    oracleConfidence: item.oracleConfidence ?? 0,
    signals: { ...DEFAULT_SIGNALS, ...(item.signals ?? {}) },
    agency: {
      ...DEFAULT_AGENCY,
      ...(item.agency ?? {}),
      operatingPolicy: { ...DEFAULT_AGENCY.operatingPolicy, ...(item.agency?.operatingPolicy ?? {}) },
      safetyControls: { ...DEFAULT_AGENCY.safetyControls, ...(item.agency?.safetyControls ?? {}) }
    },
    payloadHash: item.payloadHash ?? "unavailable",
    signatureAlgorithm: item.signatureAlgorithm ?? "offline",
    telemetrySignature: item.telemetrySignature ?? "unavailable"
  };
}

export function normalizeTelemetryList(raw: unknown): AssetTelemetry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeTelemetry(item as Partial<AssetTelemetry>)).filter((item) => item.asset);
}
