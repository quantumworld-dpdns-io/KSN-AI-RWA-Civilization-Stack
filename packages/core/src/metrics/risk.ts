export interface RiskMetrics {
  operationalRisk: number;
  marketRisk: number;
  regulatoryRisk: number;
  technicalRisk: number;
  environmentalRisk: number;
}

export const calculateRiskMetrics = (
  uptime: number,
  priceVolatility: number,
  complianceScore: number,
  architectureAgeYears: number,
  carbonIntensity: number
): RiskMetrics => {
  return {
    operationalRisk: 1 - uptime, // lower uptime = higher risk
    marketRisk: Math.min(1, priceVolatility),
    regulatoryRisk: 1 - complianceScore,
    technicalRisk: Math.min(1, architectureAgeYears / 10), // assumes obsolete in 10 years
    environmentalRisk: Math.min(1, carbonIntensity / 1000) // normalize roughly
  };
};
