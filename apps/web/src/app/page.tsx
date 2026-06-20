import { SAMPLE_ASSETS, estimateAutonomyRisk, simulateYieldDistribution, snapshotAsset } from "@aks/core";
import { Dashboard } from "@/components/dashboard";
import { getHealth, getTelemetry } from "@/lib/oracle";
import type { AssetTelemetry } from "@/lib/types";

export const dynamic = "force-dynamic";

function fallbackTelemetry(): AssetTelemetry[] {
  return SAMPLE_ASSETS.map((asset) => ({
    timestamp: new Date().toISOString(),
    asset,
    ksn: snapshotAsset(asset),
    yieldDistribution: simulateYieldDistribution(asset),
    autonomyRisk: estimateAutonomyRisk(asset),
    oracleConfidence: 0,
    telemetrySignature: "offline-fallback"
  }));
}

export default async function Home() {
  const [telemetry, health] = await Promise.all([
    getTelemetry().catch(fallbackTelemetry),
    getHealth()
  ]);

  return <Dashboard initialTelemetry={telemetry} initialHealth={health} />;
}
