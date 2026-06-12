import type { AgencyStage, InfrastructureAsset } from "./types";

const stageOrder: AgencyStage[] = [
  "HUMAN_OWNED",
  "AI_MANAGED",
  "AI_ISSUED",
  "AI_CO_OWNED",
  "SOVEREIGN_AI_ASSET",
  "PLANETARY_AI_ALLOCATOR",
  "KARDASHEV_CONVERGENCE"
];

export function agencyStageIndex(stage: AgencyStage): number {
  return stageOrder.indexOf(stage);
}

export function nextAgencyStage(stage: AgencyStage): AgencyStage {
  const idx = agencyStageIndex(stage);
  return stageOrder[Math.min(idx + 1, stageOrder.length - 1)];
}

export function describeAgencyStage(stage: AgencyStage): string {
  switch (stage) {
    case "HUMAN_OWNED":
      return "Human-owned RWA. AI is only an analytics layer.";
    case "AI_MANAGED":
      return "AI manages pricing, routing, and maintenance but does not own the asset.";
    case "AI_ISSUED":
      return "AI or AI-controlled legal wrapper issues claims to expand physical capacity.";
    case "AI_CO_OWNED":
      return "AI treasury owns a meaningful stake beside human investors.";
    case "SOVEREIGN_AI_ASSET":
      return "AI has economically bought out or controlled the asset base.";
    case "PLANETARY_AI_ALLOCATOR":
      return "AI routes planetary-scale energy and compute infrastructure.";
    case "KARDASHEV_CONVERGENCE":
      return "AI abstracts Kardashev-scale infrastructure into civilization dividends.";
  }
}

export function estimateAutonomyRisk(asset: InfrastructureAsset): number {
  const stageRisk = agencyStageIndex(asset.agencyStage) / (stageOrder.length - 1);
  const scaleRisk = Math.min(1, Math.log10(asset.powerWatts) / 26);
  const utilizationPressure = Math.max(0, asset.utilization - 0.75) * 1.5;
  return clamp01(0.45 * stageRisk + 0.35 * scaleRisk + 0.2 * utilizationPressure + asset.riskScore * 0.15);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
