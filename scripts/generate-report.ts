import { SAMPLE_ASSETS, describeAgencyStage, estimateAutonomyRisk, simulateYieldDistribution, snapshotAsset } from "../packages/core/src/index";

const report = SAMPLE_ASSETS.map((asset) => ({
  id: asset.id,
  name: asset.name,
  assetClass: asset.assetClass,
  agencyStage: asset.agencyStage,
  agencyDescription: describeAgencyStage(asset.agencyStage),
  snapshot: snapshotAsset(asset),
  autonomyRisk: estimateAutonomyRisk(asset),
  yieldDistribution: simulateYieldDistribution(asset)
}));

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));
