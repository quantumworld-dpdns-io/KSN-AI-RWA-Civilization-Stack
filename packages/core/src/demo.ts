import { SAMPLE_ASSETS, describeAgencyStage, estimateAutonomyRisk, simulateYieldDistribution, snapshotAsset } from "./index";

for (const asset of SAMPLE_ASSETS) {
  const snapshot = snapshotAsset(asset);
  const yieldDistribution = simulateYieldDistribution(asset);
  console.log(JSON.stringify({
    asset: asset.name,
    snapshot,
    agency: describeAgencyStage(asset.agencyStage),
    autonomyRisk: estimateAutonomyRisk(asset),
    yieldDistribution
  }, null, 2));
}
