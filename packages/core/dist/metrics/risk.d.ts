export interface RiskMetrics {
    operationalRisk: number;
    marketRisk: number;
    regulatoryRisk: number;
    technicalRisk: number;
    environmentalRisk: number;
}
export declare const calculateRiskMetrics: (uptime: number, priceVolatility: number, complianceScore: number, architectureAgeYears: number, carbonIntensity: number) => RiskMetrics;
//# sourceMappingURL=risk.d.ts.map