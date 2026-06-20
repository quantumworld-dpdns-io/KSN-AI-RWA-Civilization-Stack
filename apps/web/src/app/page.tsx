import { SAMPLE_ASSETS, agencyStageIndex, describeAgencyStage, estimateAutonomyRisk, nextAgencyStage, simulateYieldDistribution, snapshotAsset } from "@aks/core";
import { Dashboard } from "@/components/dashboard";
import { getCapabilities, getHealth, getTelemetry } from "@/lib/oracle";
import type { AssetTelemetry, OracleCapabilities } from "@/lib/types";

export const dynamic = "force-dynamic";

function fallbackTelemetry(): AssetTelemetry[] {
  return SAMPLE_ASSETS.map((asset) => ({
    timestamp: new Date().toISOString(),
    asset,
    ksn: snapshotAsset(asset),
    yieldDistribution: simulateYieldDistribution(asset),
    autonomyRisk: estimateAutonomyRisk(asset),
    oracleConfidence: 0,
    signals: {
      energySource: asset.energySource ?? "UNKNOWN", computeArchitecture: asset.computeArchitecture ?? "UNKNOWN",
      networkTopology: asset.topology ?? "UNKNOWN", region: asset.region ?? "UNKNOWN",
      complianceStatus: asset.complianceStatus ?? "PENDING_REVIEW", maintenanceCostRate: asset.maintenanceCostRate,
      carbonIntensityKgCo2ePerKwh: asset.carbonIntensityKgCo2ePerKwh ?? 0,
      geopoliticalRiskScore: asset.geopoliticalRiskScore ?? asset.riskScore,
      legalRiskScore: asset.legalRiskScore ?? asset.riskScore, aggregateRiskScore: asset.riskScore
    },
    agency: {
      stage: asset.agencyStage, stageIndex: agencyStageIndex(asset.agencyStage), description: describeAgencyStage(asset.agencyStage),
      nextStage: nextAgencyStage(asset.agencyStage),
      operatingPolicy: { dynamicPriceMultiplier: 1, routeToLowestCarbonEnergy: false, reserveMaintenanceCapital: false, mayIssueExpansionClaims: false, mayAcquireOwnership: false, distributesCivilizationDividend: false },
      safetyControls: { externalExecutionEnabled: false, killSwitchAvailable: true, humanApprovalRequiredForIssuanceAndOwnership: true, maxDynamicPriceMultiplier: 1.5 }
    },
    payloadHash: "offline-fallback",
    signatureAlgorithm: "offline",
    telemetrySignature: "offline-fallback"
  }));
}

const fallbackCapabilities: OracleCapabilities = {
  service: "aks-oracle-sim", persistence: "redis", sqlPersistence: false,
  telemetry: ["energy", "compute", "utilization", "maintenance", "carbon", "geopolitical-risk", "legal-risk"],
  calculations: ["ksn-score", "kardashev-type", "yield-distribution", "autonomy-risk", "oracle-confidence"],
  integrity: ["sha256-payload-hash", "hmac-sha256-signature", "bounded-audit-history"], endpoints: []
};

export default async function Home() {
  const [telemetry, health, capabilities] = await Promise.all([
    getTelemetry().catch(fallbackTelemetry),
    getHealth(),
    getCapabilities().catch(() => fallbackCapabilities)
  ]);

  return <Dashboard initialTelemetry={telemetry} initialHealth={health} initialCapabilities={capabilities} />;
}
