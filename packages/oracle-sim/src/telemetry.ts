import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import {
  SAMPLE_ASSETS,
  agencyStageIndex,
  describeAgencyStage,
  estimateAutonomyRisk,
  nextAgencyStage,
  simulateYieldDistribution,
  snapshotAsset,
  type InfrastructureAsset
} from "@aks/core";

export const SIGNATURE_ALGORITHM = "hmac-sha256";

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

export interface AssetTelemetry {
  timestamp: string;
  asset: InfrastructureAsset;
  ksn: ReturnType<typeof snapshotAsset>;
  yieldDistribution: ReturnType<typeof simulateYieldDistribution>;
  autonomyRisk: number;
  oracleConfidence: number;
  signals: OracleSignals;
  agency: {
    stage: InfrastructureAsset["agencyStage"];
    stageIndex: number;
    description: string;
    nextStage: InfrastructureAsset["agencyStage"];
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
      killSwitchAvailable: true;
      humanApprovalRequiredForIssuanceAndOwnership: true;
      maxDynamicPriceMultiplier: number;
    };
  };
  payloadHash: string;
  signatureAlgorithm: typeof SIGNATURE_ALGORITHM;
  telemetrySignature: string;
}

type UnsignedTelemetry = Omit<AssetTelemetry, "payloadHash" | "signatureAlgorithm" | "telemetrySignature">;

export function getAssetTelemetry(assetId: string, timestamp = new Date().toISOString()): AssetTelemetry | null {
  const asset = SAMPLE_ASSETS.find((item) => item.id === assetId);
  if (!asset) return null;
  return buildTelemetry(asset, timestamp);
}

export function buildTelemetry(asset: InfrastructureAsset, timestamp = new Date().toISOString(), applyJitter = true): AssetTelemetry {
  const jitter = applyJitter ? deterministicJitter(asset.id) : 0;
  const mutated: InfrastructureAsset = {
    ...asset,
    utilization: clamp01(asset.utilization + jitter * 0.05),
    powerWatts: asset.powerWatts * (1 + jitter * 0.02),
    hashrate: asset.hashrate * (1 + jitter * 0.03)
  };
  const signals: OracleSignals = {
    energySource: mutated.energySource ?? "UNKNOWN",
    computeArchitecture: mutated.computeArchitecture ?? "UNKNOWN",
    networkTopology: mutated.topology ?? "UNKNOWN",
    region: mutated.region ?? "UNKNOWN",
    complianceStatus: mutated.complianceStatus ?? "PENDING_REVIEW",
    maintenanceCostRate: mutated.maintenanceCostRate,
    carbonIntensityKgCo2ePerKwh: mutated.carbonIntensityKgCo2ePerKwh ?? 0,
    geopoliticalRiskScore: clamp01(mutated.geopoliticalRiskScore ?? mutated.riskScore),
    legalRiskScore: clamp01(mutated.legalRiskScore ?? mutated.riskScore),
    aggregateRiskScore: clamp01(mutated.riskScore)
  };
  const unsigned: UnsignedTelemetry = {
    timestamp,
    asset: mutated,
    ksn: snapshotAsset(mutated),
    yieldDistribution: simulateYieldDistribution(mutated),
    autonomyRisk: estimateAutonomyRisk(mutated),
    oracleConfidence: clamp01(
      0.96 - signals.aggregateRiskScore * 0.2 - signals.geopoliticalRiskScore * 0.08 - signals.legalRiskScore * 0.08 + jitter * 0.03
    ),
    signals,
    agency: {
      stage: mutated.agencyStage,
      stageIndex: agencyStageIndex(mutated.agencyStage),
      description: describeAgencyStage(mutated.agencyStage),
      nextStage: nextAgencyStage(mutated.agencyStage),
      operatingPolicy: {
        dynamicPriceMultiplier: Number((1 + Math.max(0, mutated.utilization - 0.65) * 0.8).toFixed(4)),
        routeToLowestCarbonEnergy: agencyStageIndex(mutated.agencyStage) >= 1,
        reserveMaintenanceCapital: agencyStageIndex(mutated.agencyStage) >= 1,
        mayIssueExpansionClaims: agencyStageIndex(mutated.agencyStage) >= 2,
        mayAcquireOwnership: agencyStageIndex(mutated.agencyStage) >= 3,
        distributesCivilizationDividend: agencyStageIndex(mutated.agencyStage) >= 5
      },
      safetyControls: {
        externalExecutionEnabled: false,
        killSwitchAvailable: true,
        humanApprovalRequiredForIssuanceAndOwnership: true,
        maxDynamicPriceMultiplier: 1.5
      }
    }
  };
  const canonical = JSON.stringify(unsigned);
  return {
    ...unsigned,
    payloadHash: createHash("sha256").update(canonical).digest("hex"),
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    telemetrySignature: createHmac("sha256", signingSecret()).update(canonical).digest("hex")
  };
}

export function verifyTelemetrySignature(telemetry: AssetTelemetry): boolean {
  const { payloadHash, signatureAlgorithm, telemetrySignature, ...unsigned } = telemetry;
  if (
    signatureAlgorithm !== SIGNATURE_ALGORITHM
    || !/^[a-f0-9]{64}$/.test(payloadHash)
    || !/^[a-f0-9]{64}$/.test(telemetrySignature)
  ) return false;
  const canonical = JSON.stringify(unsigned);
  const expectedHash = createHash("sha256").update(canonical).digest("hex");
  const expectedSignature = createHmac("sha256", signingSecret()).update(canonical).digest("hex");
  if (payloadHash !== expectedHash) return false;
  return timingSafeEqual(Buffer.from(telemetrySignature, "hex"), Buffer.from(expectedSignature, "hex"));
}

export function listTelemetry(timestamp = new Date().toISOString()): AssetTelemetry[] {
  return SAMPLE_ASSETS.map((asset) => buildTelemetry(asset, timestamp));
}

export function isProductionSigningConfigured(): boolean {
  return Boolean(process.env.ORACLE_SIGNING_SECRET);
}

function signingSecret(): string {
  return process.env.ORACLE_SIGNING_SECRET ?? "aks-local-development-signing-key";
}

function deterministicJitter(input: string): number {
  let hash = 0;
  for (const char of input) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ((hash % 2000) / 1000 - 1) / 10;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
