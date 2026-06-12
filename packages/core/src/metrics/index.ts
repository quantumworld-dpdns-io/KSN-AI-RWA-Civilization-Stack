import { EfficiencyMetrics } from './efficiency';
import { KardashevMetrics } from './kardashev';
import { RiskMetrics } from './risk';
import { CompositeMetrics } from './composite';

export * from './efficiency';
export * from './kardashev';
export * from './risk';
export * from './composite';

export const validateMetrics = (value: number, min: number = 0, max: number = 1): boolean => {
  return value >= min && value <= max && !isNaN(value) && isFinite(value);
};

export const compareEfficiency = (a: EfficiencyMetrics, b: EfficiencyMetrics) => {
  return a.computePerWatt - b.computePerWatt;
};

export const compareRisk = (a: RiskMetrics, b: RiskMetrics) => {
  // Return negative if a is less risky than b
  const avgA = (a.operationalRisk + a.marketRisk + a.regulatoryRisk + a.technicalRisk + a.environmentalRisk) / 5;
  const avgB = (b.operationalRisk + b.marketRisk + b.regulatoryRisk + b.technicalRisk + b.environmentalRisk) / 5;
  return avgA - avgB;
};
